package com.aetherflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {
    private boolean success;
    private String message;
    private Object data;
    private Object errors;

    public ApiResponse() {}

    public ApiResponse(boolean success, String message, Object data, Object errors) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errors = errors;
    }

    public boolean getSuccess() {
        return this.success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return this.message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getData() {
        return this.data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public Object getErrors() {
        return this.errors;
    }

    public void setErrors(Object errors) {
        this.errors = errors;
    }

    public static ApiResponseBuilder builder() {
        return new ApiResponseBuilder();
    }

    public static class ApiResponseBuilder {
        private boolean success;
        private String message;
        private Object data;
        private Object errors;

        public ApiResponseBuilder success(boolean success) {
            this.success = success;
            return this;
        }

        public ApiResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public ApiResponseBuilder data(Object data) {
            this.data = data;
            return this;
        }

        public ApiResponseBuilder errors(Object errors) {
            this.errors = errors;
            return this;
        }

        public ApiResponse build() {
            return new ApiResponse(
                this.success,
                this.message,
                this.data,
                this.errors
            );
        }
    }

}