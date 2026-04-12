# Build stage
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests clean package spring-boot:repackage

# Run stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/krishimitra-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENV AI_SERVICE_URL=http://ai-service:8000/predict
CMD ["sh", "-c", "if [ -z \"$SPRING_DATASOURCE_URL\" ] && [ -n \"$DATABASE_URL\" ]; then DB_NOPROTO=\"${DATABASE_URL#postgresql://}\"; DB_HOST_AND_DB=\"${DB_NOPROTO#*@}\"; export SPRING_DATASOURCE_URL=\"jdbc:postgresql://${DB_HOST_AND_DB}\"; fi; exec java -jar app.jar"]
