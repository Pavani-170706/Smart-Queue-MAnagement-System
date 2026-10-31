FROM maven:3.9.6-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Use Aliyun Maven mirror
COPY settings.xml /root/.m2/settings.xml

# Copy the complete Maven multi-module project
COPY pom.xml .
COPY eureka-server/ eureka-server/
COPY api-gateway/ api-gateway/
COPY auth-service/ auth-service/
COPY user-service/ user-service/
COPY appointment-service/ appointment-service/
COPY queue-service/ queue-service/
COPY medical-service/ medical-service/
COPY notification-service/ notification-service/

# Build only auth-service and required dependencies
RUN mvn -Dmaven.wagon.http.retryHandler.count=5 -Dmaven.wagon.httpconnectionManager.ttlSeconds=60 -Daether.connector.http.retryHandler.count=5 clean package -pl auth-service -am -DskipTests -B -q

# Runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/auth-service/target/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]