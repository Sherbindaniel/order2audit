package com.orderaudit.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private Jwt jwt = new Jwt();
    private Company company = new Company();
    private Gst gst = new Gst();
    private Production production = new Production();

    @Data
    public static class Jwt {
        private String secret = "YourSuperSecretKeyForJWTTokenSigningMustBeAtLeast256BitsLong!!";
        private long expirationMs = 86400000L;
        private long refreshExpirationMs = 604800000L;
    }

    @Data
    public static class Company {
        private String name = "Sri Balaji Snacks Pvt Ltd";
        private String gstin = "33AABCS1234A1Z5";
        private String address = "No. 15, Industrial Estate, Tiruchirappalli";
        private String state = "Tamil Nadu";
        private String stateCode = "33";
        private String phone = "+91-431-2345678";
        private String email = "accounts@sribalaji.com";
    }

    @Data
    public static class Gst {
        private BigDecimal defaultRate = new BigDecimal("5.00");
        private String hsnCode = "2106";
    }

    @Data
    public static class Production {
        private BigDecimal varianceTolerance = new BigDecimal("3.00");
    }
}
