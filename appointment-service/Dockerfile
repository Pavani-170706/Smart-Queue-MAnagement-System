FROM maven:3.9.6-eclipse-temurin-21-alpine AS build

WORKDIR /app

COPY settings.xml /root/.m2/settings.xml

COPY pom.xml .
COPY eureka-server/ eureka-server/
COPY api-gateway/ api-gateway/
COPY auth-service/ auth-service/
COPY user-service/ user-service/
COPY appointment-service/ appointment-service/
COPY queue-service/ queue-service/
COPY medical-service/ medical-service/
COPY notification-service/ notification-service/

RUN mvn -Dmaven.wagon.http.retryHandler.count=5 -Dmaven.wagon.httpconnectionManager.ttlSeconds=60 -Daether.connector.http.retryHandler.count=5 clean package -pl appointment-service -am -DskipTests -B -q

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

ENV TZ=Asia/Kolkata

COPY --from=build /app/appointment-service/target/*.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]