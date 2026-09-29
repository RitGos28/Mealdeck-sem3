# syntax=docker/dockerfile:1

# ---- build: compile the Spring Boot jar ----
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Maven wrapper + pom first, and resolve dependencies in their own layer:
# a source-only change reuses this cached layer instead of re-downloading
# every dependency.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw -B -q dependency:go-offline

COPY src src
# Tests run in CI, not in the image build.
RUN ./mvnw -B -q package -DskipTests \
    && java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination extracted

# ---- runtime: JRE only, one image layer per Spring Boot jar layer ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Campus time for anything reading the system clock (the pickup clock and
# midnight reset are pinned to IST in code too).
ENV TZ=Asia/Kolkata

RUN addgroup -S app && adduser -S app -G app
USER app

# Ordered least- to most-frequently changing, so a code change only
# replaces the small `application` layer, not the ~60MB of dependencies.
COPY --from=build /app/extracted/dependencies/ ./
COPY --from=build /app/extracted/spring-boot-loader/ ./
COPY --from=build /app/extracted/snapshot-dependencies/ ./
COPY --from=build /app/extracted/application/ ./

EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=40s --retries=5 \
    CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
