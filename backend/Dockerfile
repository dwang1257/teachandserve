# syntax=docker/dockerfile:1

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Only copy the files needed to resolve dependencies first (enables Docker layer caching).
COPY pom.xml ./
RUN mvn -B dependency:go-offline

# Copy the rest of the source and build the application.
COPY src ./src
RUN mvn -B -DskipTests clean package

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Copy the fat jar produced by Spring Boot (exclude the *.original file).
COPY --from=build /app/target/*-SNAPSHOT.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=default

ENTRYPOINT ["java","-jar","/app/app.jar"]

