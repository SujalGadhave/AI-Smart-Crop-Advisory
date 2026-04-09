package com.krishimitra.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.krishimitra.backend.market.MarketPriceAlert;
import com.krishimitra.backend.market.MarketPriceAlertRepository;
import com.krishimitra.backend.notification.FarmerNotification;
import com.krishimitra.backend.notification.FarmerNotificationRepository;
import com.krishimitra.backend.notification.NotificationProviderProperties;
import com.krishimitra.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:krishimitra_test;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driverClassName=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.h2.console.enabled=false",
        "spring.jpa.show-sql=false"
})
@AutoConfigureMockMvc
@SuppressWarnings("null")
class ApiSmokeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

        @Autowired
        private MarketPriceAlertRepository marketPriceAlertRepository;

        @Autowired
        private FarmerNotificationRepository farmerNotificationRepository;

        @Autowired
        private NotificationProviderProperties notificationProviderProperties;

    @MockBean
    private RestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        reset(restTemplate);

                notificationProviderProperties.getSms().setEnabled(false);
                notificationProviderProperties.getSms().setWebhookUrl(null);
                notificationProviderProperties.getSms().setAuthToken(null);
                notificationProviderProperties.getSms().setCallbackToken(null);
                notificationProviderProperties.getSms().setMaxAttempts(1);
                notificationProviderProperties.getSms().setInitialBackoffMs(0);

                notificationProviderProperties.getWhatsapp().setEnabled(false);
                notificationProviderProperties.getWhatsapp().setWebhookUrl(null);
                notificationProviderProperties.getWhatsapp().setAuthToken(null);
                notificationProviderProperties.getWhatsapp().setCallbackToken(null);
                notificationProviderProperties.getWhatsapp().setMaxAttempts(1);
                notificationProviderProperties.getWhatsapp().setInitialBackoffMs(0);

                notificationProviderProperties.getPush().setEnabled(false);
                notificationProviderProperties.getPush().setWebhookUrl(null);
                notificationProviderProperties.getPush().setAuthToken(null);
                notificationProviderProperties.getPush().setCallbackToken(null);
                notificationProviderProperties.getPush().setMaxAttempts(1);
                notificationProviderProperties.getPush().setInitialBackoffMs(0);
    }

    @Test
    void registerAndLoginEndpointsReturnToken() throws Exception {
        String email = "farmer-" + UUID.randomUUID() + "@example.com";

        Map<String, Object> registerBody = Map.of(
                "name", "Farmer One",
                "email", email,
                "password", "StrongPass123",
                "city", "Pune"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email));

        Map<String, Object> loginBody = Map.of(
                "email", email,
                "password", "StrongPass123"
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void duplicateRegistrationReturnsStructuredBadRequest() throws Exception {
        String email = "duplicate-" + UUID.randomUUID() + "@example.com";

        Map<String, Object> registerBody = Map.of(
                "name", "Farmer Duplicate",
                "email", email,
                "password", "StrongPass123",
                "city", "Pune"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerBody)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerBody)))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("X-Error-Code", "DUPLICATE_EMAIL"))
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void loginIsCaseInsensitiveForEmail() throws Exception {
        String email = "case-" + UUID.randomUUID() + "@example.com";

        Map<String, Object> registerBody = Map.of(
                "name", "Farmer Case",
                "email", email,
                "password", "StrongPass123",
                "city", "Pune"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerBody)))
                .andExpect(status().isOk());

        Map<String, Object> loginBody = Map.of(
                "email", email.toUpperCase(),
                "password", "StrongPass123"
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void detectEndpointRequiresAuthentication() throws Exception {
        Map<String, Object> detectBody = Map.of(
                "cropType", "tomato",
                "imageBase64", "dGVzdA=="
        );

        mockMvc.perform(post("/api/crop/detect")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(detectBody)))
                .andExpect(status().isForbidden());
    }

    @Test
    void detectEndpointReturnsAiResultWhenAuthenticated() throws Exception {
        Map<String, Object> aiResponse = new HashMap<>();
        aiResponse.put("disease", "tomato_late_blight");
        aiResponse.put("confidence", 0.91);
        aiResponse.put("severity", "high");
        aiResponse.put("affected_area_percent", 18.5);
        aiResponse.put("symptoms", List.of("dark spots"));
        aiResponse.put("is_healthy", false);

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(aiResponse);

        String token = jwtService.generateToken("farmer@example.com");
        Map<String, Object> detectBody = Map.of(
                "cropType", "tomato",
                "imageBase64", "dGVzdA=="
        );

        mockMvc.perform(post("/api/crop/detect")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(detectBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cropType").value("tomato"))
                .andExpect(jsonPath("$.diseaseName").value("tomato_late_blight"))
                .andExpect(jsonPath("$.confidence").value(0.91));

        mockMvc.perform(get("/api/crop/timeline")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].cropType").value("tomato"))
                .andExpect(jsonPath("$[0].followUpStatus").value("PENDING"));
    }

    @Test
    void followUpStatusCanBeUpdatedForOwnTimelineReport() throws Exception {
        Map<String, Object> aiResponse = new HashMap<>();
        aiResponse.put("disease", "tomato_late_blight");
        aiResponse.put("confidence", 0.89);
        aiResponse.put("severity", "high");
        aiResponse.put("affected_area_percent", 10.0);
        aiResponse.put("symptoms", List.of("dark lesions"));
        aiResponse.put("is_healthy", false);

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(aiResponse);

        String token = jwtService.generateToken("farmer@example.com");
        Map<String, Object> detectBody = Map.of(
                "cropType", "tomato",
                "imageBase64", "dGVzdA=="
        );

        mockMvc.perform(post("/api/crop/detect")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(detectBody)))
                .andExpect(status().isOk());

        MvcResult timelineResult = mockMvc.perform(get("/api/crop/timeline")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "1"))
                .andExpect(status().isOk())
                .andReturn();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> timeline = objectMapper.readValue(
                timelineResult.getResponse().getContentAsString(),
                List.class
        );
        Number reportId = (Number) timeline.get(0).get("reportId");

        mockMvc.perform(patch("/api/crop/reports/{reportId}/follow-up", reportId.longValue())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "IN_PROGRESS",
                                "notes", "Applied first spray"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followUpStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.followUpNotes").value("Applied first spray"));
    }

    @Test
    void riskAlertsEndpointReturnsHighRiskAlertForPendingHighSeverityCase() throws Exception {
        Map<String, Object> aiResponse = new HashMap<>();
        aiResponse.put("disease", "tomato_late_blight");
        aiResponse.put("confidence", 0.95);
        aiResponse.put("severity", "high");
        aiResponse.put("affected_area_percent", 21.0);
        aiResponse.put("symptoms", List.of("dark lesions"));
        aiResponse.put("is_healthy", false);

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(aiResponse);

        String token = jwtService.generateToken("farmer@example.com");
        Map<String, Object> detectBody = Map.of(
                "cropType", "tomato",
                "imageBase64", "dGVzdA=="
        );

        mockMvc.perform(post("/api/crop/detect")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(detectBody)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/crop/risk-alerts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].level").value("HIGH"))
                .andExpect(jsonPath("$[0].reportId").isNumber())
                .andExpect(jsonPath("$[0].diseaseName").value("tomato late blight"));
    }

    @Test
    void marketAlertCanBeCreatedListedAndDeletedForAuthenticatedUser() throws Exception {
        when(restTemplate.getForObject(contains("dataapi/market"), eq(Map.class)))
                .thenThrow(new RuntimeException("Market API unavailable"));

        String token = jwtService.generateToken("farmer@example.com");

        MvcResult createResult = mockMvc.perform(post("/api/market/alerts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "cropType", "tomato",
                                "city", "Pune",
                                "targetPrice", 2100,
                                "direction", "ABOVE"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cropType").value("tomato"))
                .andExpect(jsonPath("$.triggered").value(true))
                .andReturn();

        @SuppressWarnings("unchecked")
        Map<String, Object> created = objectMapper.readValue(createResult.getResponse().getContentAsString(), Map.class);
        Number alertId = (Number) created.get("alertId");

        mockMvc.perform(get("/api/market/alerts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].alertId").value(alertId.longValue()))
                .andExpect(jsonPath("$[0].triggered").value(true));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/market/alerts/{alertId}", alertId.longValue())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/market/alerts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void notificationsCanBeListedAndMarkedAsReadForAuthenticatedUser() throws Exception {
        Map<String, Object> aiResponse = new HashMap<>();
        aiResponse.put("disease", "tomato_late_blight");
        aiResponse.put("confidence", 0.95);
        aiResponse.put("severity", "high");
        aiResponse.put("affected_area_percent", 21.0);
        aiResponse.put("symptoms", List.of("dark lesions"));
        aiResponse.put("is_healthy", false);

        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(aiResponse);

        String token = jwtService.generateToken("farmer@example.com");
        Map<String, Object> detectBody = Map.of(
                "cropType", "tomato",
                "imageBase64", "dGVzdA=="
        );

        mockMvc.perform(post("/api/crop/detect")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(detectBody)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/market/alerts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "cropType", "tomato",
                                "city", "Pune",
                                "targetPrice", 2100,
                                "direction", "ABOVE"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.triggered").value(true));

        MvcResult notificationsResult = mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].read").value(false))
                .andReturn();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> notifications = objectMapper.readValue(
                notificationsResult.getResponse().getContentAsString(),
                List.class
        );
        boolean hasRisk = notifications.stream()
                .anyMatch(item -> "RISK_ALERT".equals(item.get("type")));
        boolean hasMarket = notifications.stream()
                .anyMatch(item -> "MARKET_ALERT".equals(item.get("type")));

        org.junit.jupiter.api.Assertions.assertTrue(hasRisk, "Expected risk alert notification");
        org.junit.jupiter.api.Assertions.assertTrue(hasMarket, "Expected market alert notification");

        Number notificationId = (Number) notifications.get(0).get("notificationId");

        mockMvc.perform(patch("/api/notifications/{notificationId}/read", notificationId.longValue())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));

        mockMvc.perform(patch("/api/notifications/read-all")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updated").isNumber());

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }

    @Test
    void notificationPreferencesCanBeUpdatedAndDeliveryHistoryIsRecorded() throws Exception {
        String farmerEmail = "delivery-" + UUID.randomUUID() + "@example.com";
        String token = jwtService.generateToken(farmerEmail);

        mockMvc.perform(put("/api/notifications/preferences")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "inAppEnabled", true,
                                "smsEnabled", true,
                                "whatsappEnabled", true,
                                "pushEnabled", false,
                                "smsNumber", "+919900112233",
                                "whatsappNumber", "+919900223344"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.smsEnabled").value(true))
                .andExpect(jsonPath("$.whatsappEnabled").value(true))
                .andExpect(jsonPath("$.smsNumber").value("+919900112233"));

        Map<String, Object> aiResponse = new HashMap<>();
        aiResponse.put("disease", "tomato_late_blight");
        aiResponse.put("confidence", 0.92);
        aiResponse.put("severity", "high");
        aiResponse.put("affected_area_percent", 19.0);
        aiResponse.put("symptoms", List.of("dark spots"));
        aiResponse.put("is_healthy", false);
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(aiResponse);

        mockMvc.perform(post("/api/crop/detect")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "cropType", "tomato",
                                "imageBase64", "dGVzdA=="
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "10"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications/delivery-history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].channel").isNotEmpty())
                .andExpect(jsonPath("$[0].status").isNotEmpty())
                .andExpect(jsonPath("$[?(@.channel=='SMS' && @.status=='DELIVERED')]" ).isNotEmpty())
                .andExpect(jsonPath("$[?(@.channel=='WHATSAPP' && @.status=='DELIVERED')]" ).isNotEmpty());
    }

    @Test
    void notificationPreferenceValidationRequiresDestinationWhenEnabled() throws Exception {
        String token = jwtService.generateToken("invalid-pref-" + UUID.randomUUID() + "@example.com");

        mockMvc.perform(put("/api/notifications/preferences")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "inAppEnabled", true,
                                "smsEnabled", true,
                                "whatsappEnabled", false,
                                "pushEnabled", false,
                                "smsNumber", "  "
                        ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deliveryHistoryMarksSmsFailedWhenProviderEnabledWithoutWebhookUrl() throws Exception {
        notificationProviderProperties.getSms().setEnabled(true);
        notificationProviderProperties.getSms().setWebhookUrl("  ");

        String farmerEmail = "provider-fail-" + UUID.randomUUID() + "@example.com";
        String token = jwtService.generateToken(farmerEmail);

        mockMvc.perform(put("/api/notifications/preferences")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "inAppEnabled", true,
                                "smsEnabled", true,
                                "whatsappEnabled", false,
                                "pushEnabled", false,
                                "smsNumber", "+919900445566"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.smsEnabled").value(true));

        Map<String, Object> aiResponse = new HashMap<>();
        aiResponse.put("disease", "tomato_late_blight");
        aiResponse.put("confidence", 0.92);
        aiResponse.put("severity", "high");
        aiResponse.put("affected_area_percent", 19.0);
        aiResponse.put("symptoms", List.of("dark spots"));
        aiResponse.put("is_healthy", false);
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(aiResponse);

        mockMvc.perform(post("/api/crop/detect")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "cropType", "tomato",
                                "imageBase64", "dGVzdA=="
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "10"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications/delivery-history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.channel=='SMS' && @.status=='FAILED')]" ).isNotEmpty())
                .andExpect(jsonPath("$[?(@.channel=='SMS' && @.status=='FAILED' && @.errorMessage =~ /.*webhookUrl is not configured.*/)]" ).isNotEmpty());
    }

    @Test
    void failedDeliveryAttemptCanBeRetried() throws Exception {
        notificationProviderProperties.getSms().setEnabled(true);
        notificationProviderProperties.getSms().setWebhookUrl("  ");

        String farmerEmail = "retry-" + UUID.randomUUID() + "@example.com";
        String token = jwtService.generateToken(farmerEmail);

        mockMvc.perform(put("/api/notifications/preferences")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "inAppEnabled", true,
                                "smsEnabled", true,
                                "whatsappEnabled", false,
                                "pushEnabled", false,
                                "smsNumber", "+919900445566"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.smsEnabled").value(true));

        Map<String, Object> aiResponse = new HashMap<>();
        aiResponse.put("disease", "tomato_late_blight");
        aiResponse.put("confidence", 0.92);
        aiResponse.put("severity", "high");
        aiResponse.put("affected_area_percent", 19.0);
        aiResponse.put("symptoms", List.of("dark spots"));
        aiResponse.put("is_healthy", false);
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(aiResponse);

        mockMvc.perform(post("/api/crop/detect")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "cropType", "tomato",
                                "imageBase64", "dGVzdA=="
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "10"))
                .andExpect(status().isOk());

        MvcResult historyResult = mockMvc.perform(get("/api/notifications/delivery-history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.channel=='SMS' && @.status=='FAILED')]" ).isNotEmpty())
                .andReturn();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> history = objectMapper.readValue(
                historyResult.getResponse().getContentAsString(),
                List.class
        );
        Number failedAttemptId = history.stream()
                .filter(item -> "SMS".equals(item.get("channel")) && "FAILED".equals(item.get("status")))
                .map(item -> (Number) item.get("attemptId"))
                .findFirst()
                .orElseThrow();

        notificationProviderProperties.getSms().setWebhookUrl("http://sms-provider.local/send");
        when(restTemplate.postForEntity(eq("http://sms-provider.local/send"), any(), eq(Map.class)))
                .thenReturn(new org.springframework.http.ResponseEntity<>(
                        Map.of("providerRef", "SMS-RETRY-OK", "message", "Accepted"),
                        HttpStatusCode.valueOf(200)
                ));

        mockMvc.perform(post("/api/notifications/delivery-history/{attemptId}/retry", failedAttemptId.longValue())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.channel").value("SMS"))
                .andExpect(jsonPath("$.status").value("DELIVERED"))
                .andExpect(jsonPath("$.providerRef").value("SMS-RETRY-OK"))
                .andExpect(jsonPath("$.providerStatusCode").value(200));
    }

    @Test
    void providerCallbackCanUpdateDeliveryAttemptStatus() throws Exception {
        notificationProviderProperties.getSms().setEnabled(true);
        notificationProviderProperties.getSms().setWebhookUrl("http://sms-provider.local/send");
        notificationProviderProperties.getSms().setCallbackToken("sms-callback-token");

        String farmerEmail = "callback-" + UUID.randomUUID() + "@example.com";
        String token = jwtService.generateToken(farmerEmail);

        mockMvc.perform(put("/api/notifications/preferences")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "inAppEnabled", true,
                                "smsEnabled", true,
                                "whatsappEnabled", false,
                                "pushEnabled", false,
                                "smsNumber", "+919955667788"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.smsEnabled").value(true));

        Map<String, Object> aiResponse = new HashMap<>();
        aiResponse.put("disease", "tomato_late_blight");
        aiResponse.put("confidence", 0.92);
        aiResponse.put("severity", "high");
        aiResponse.put("affected_area_percent", 19.0);
        aiResponse.put("symptoms", List.of("dark spots"));
        aiResponse.put("is_healthy", false);
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(aiResponse);

        when(restTemplate.postForEntity(eq("http://sms-provider.local/send"), any(), eq(Map.class)))
                .thenReturn(new org.springframework.http.ResponseEntity<>(
                        Map.of("providerRef", "SMS-CALLBACK-REF", "message", "Queued"),
                        HttpStatusCode.valueOf(202)
                ));

        mockMvc.perform(post("/api/crop/detect")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "cropType", "tomato",
                                "imageBase64", "dGVzdA=="
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "10"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/notifications/provider-callbacks/SMS")
                        .header("X-Provider-Token", "sms-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "providerRef", "SMS-CALLBACK-REF",
                                "status", "FAILED",
                                "providerStatusCode", 500,
                                "providerMessage", "Delivery failed at provider",
                                "errorMessage", "Timeout at downstream operator"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.channel").value("SMS"))
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.providerRef").value("SMS-CALLBACK-REF"))
                .andExpect(jsonPath("$.providerStatusCode").value(500))
                .andExpect(jsonPath("$.providerMessage").value("Delivery failed at provider"))
                .andExpect(jsonPath("$.errorMessage").value("Timeout at downstream operator"));

        mockMvc.perform(get("/api/notifications/delivery-history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.channel=='SMS' && @.providerRef=='SMS-CALLBACK-REF' && @.status=='FAILED')]" ).isNotEmpty());
    }

    @Test
    void providerCallbackRejectsInvalidToken() throws Exception {
        notificationProviderProperties.getSms().setCallbackToken("sms-callback-token");

        mockMvc.perform(post("/api/notifications/provider-callbacks/SMS")
                        .header("X-Provider-Token", "wrong-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "providerRef", "SMS-CALLBACK-REF",
                                "status", "FAILED"
                        ))))
                .andExpect(status().isUnauthorized());
    }

        @Test
        void providerPolicyEndpointReturnsEffectiveSettingsForAuthenticatedUser() throws Exception {
                notificationProviderProperties.getSms().setEnabled(true);
                notificationProviderProperties.getSms().setMaxAttempts(9);
                notificationProviderProperties.getSms().setInitialBackoffMs(12000);

                notificationProviderProperties.getWhatsapp().setEnabled(false);
                notificationProviderProperties.getWhatsapp().setMaxAttempts(3);
                notificationProviderProperties.getWhatsapp().setInitialBackoffMs(200);

                notificationProviderProperties.getPush().setEnabled(false);
                notificationProviderProperties.getPush().setMaxAttempts(2);
                notificationProviderProperties.getPush().setInitialBackoffMs(150);

                String token = jwtService.generateToken("policy-" + UUID.randomUUID() + "@example.com");

                mockMvc.perform(get("/api/notifications/provider-policy")
                                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[?(@.channel=='SMS' && @.enabled==true)]").isNotEmpty())
                                .andExpect(jsonPath("$[?(@.channel=='SMS' && @.configuredMaxAttempts==9)]").isNotEmpty())
                                .andExpect(jsonPath("$[?(@.channel=='SMS' && @.effectiveMaxAttempts==5)]").isNotEmpty())
                                .andExpect(jsonPath("$[?(@.channel=='SMS' && @.configuredInitialBackoffMs==12000)]").isNotEmpty())
                                .andExpect(jsonPath("$[?(@.channel=='SMS' && @.effectiveInitialBackoffMs==5000)]").isNotEmpty())
                                .andExpect(jsonPath("$[?(@.channel=='WHATSAPP' && @.effectiveMaxAttempts==3)]").isNotEmpty())
                                .andExpect(jsonPath("$[?(@.channel=='PUSH' && @.effectiveMaxAttempts==2)]").isNotEmpty());
        }

    @Test
    void legacyMarketNotificationIsMigratedToStructuredPayloadOnRead() throws Exception {
        String farmerEmail = "legacy-farmer@example.com";
        String token = jwtService.generateToken(farmerEmail);

        MarketPriceAlert alert = marketPriceAlertRepository.save(new MarketPriceAlert(
                farmerEmail,
                "tomato",
                "pune",
                2100,
                "ABOVE"
        ));

        farmerNotificationRepository.save(new FarmerNotification(
                farmerEmail,
                "MARKET_ALERT",
                "MARKET_ALERT_" + alert.getId(),
                null,
                "MEDIUM",
                "Market alert triggered for tomato",
                "Price 2200 reached target 2100 (ABOVE) in pune.",
                Instant.now()
        ));

        MvcResult result = mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("MARKET_ALERT"))
                .andExpect(jsonPath("$[0].title").value("MARKET_ALERT_TRIGGERED"))
                .andExpect(jsonPath("$[0].sourceReportId").value(alert.getId()))
                .andReturn();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> notifications = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                List.class
        );
        String migratedMessage = String.valueOf(notifications.get(0).get("message"));
        org.junit.jupiter.api.Assertions.assertEquals(5, migratedMessage.split("\\|").length,
                "Expected structured market notification payload");
    }

    @Test
    void advisoryWeatherAndMarketEndpointsRespondSuccessfully() throws Exception {
        Map<String, Object> currentWeather = Map.of(
                "temperature", 29.4,
                "windspeed", 3.1,
                "weathercode", 1
        );
        when(restTemplate.getForObject(contains("open-meteo"), eq(Map.class)))
                .thenReturn(Map.of("current_weather", currentWeather));

        when(restTemplate.getForObject(contains("dataapi/market"), eq(Map.class)))
                .thenThrow(new RuntimeException("Market API unavailable"));

        mockMvc.perform(get("/api/advisory")
                        .param("cropType", "tomato")
                        .param("season", "kharif"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cropType").value("tomato"))
                .andExpect(jsonPath("$.fertilizer").isArray());

        mockMvc.perform(get("/api/weather").param("city", "Pune"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.city").value("Pune"))
                .andExpect(jsonPath("$.temperature").value(29.4));

        mockMvc.perform(get("/api/market")
                        .param("cropType", "tomato")
                        .param("city", "Pune"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cropType").value("tomato"))
                .andExpect(jsonPath("$.trend").isArray());
    }
}
