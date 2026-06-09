import { describe, expect, it } from "vitest";
import { validateContact } from "../contact-validation";

describe("validateContact", () => {
  it("returns valid for correct input", () => {
    const result = validateContact({
      name: "John Doe",
      email: "john@example.com",
      message: "Hello, I have a question about your work.",
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe("John Doe");
      expect(result.data.email).toBe("john@example.com");
    }
  });

  it("trims whitespace from fields", () => {
    const result = validateContact({
      name: "  John  ",
      email: "john@example.com",
      message: "  Hello world, this is a test message.  ",
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe("John");
      expect(result.data.message).toBe("Hello world, this is a test message.");
    }
  });

  describe("name validation", () => {
    it("rejects missing name", () => {
      const result = validateContact({
        email: "a@b.com",
        message: "Hello world, testing testing",
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContain("Name is required.");
      }
    });

    it("rejects empty name", () => {
      const result = validateContact({
        name: "   ",
        email: "a@b.com",
        message: "Hello world, testing testing",
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContain("Name is required.");
      }
    });

    it("rejects name over 100 chars", () => {
      const result = validateContact({
        name: "x".repeat(101),
        email: "a@b.com",
        message: "Hello world, testing testing",
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContain("Name must be under 100 characters.");
      }
    });

    it("accepts name exactly 100 chars", () => {
      const result = validateContact({
        name: "x".repeat(100),
        email: "a@b.com",
        message: "Hello world, testing testing",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("email validation", () => {
    it("rejects missing email", () => {
      const result = validateContact({
        name: "John",
        message: "Hello world, testing testing",
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContain("A valid email is required.");
      }
    });

    it("rejects invalid email format", () => {
      const result = validateContact({
        name: "John",
        email: "not-an-email",
        message: "Hello world, testing testing",
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContain("A valid email is required.");
      }
    });

    it("accepts emails with subdomains and plus signs", () => {
      const result = validateContact({
        name: "John",
        email: "user+tag@sub.example.co.uk",
        message: "Hello world, testing testing",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("message validation", () => {
    it("rejects missing message", () => {
      const result = validateContact({
        name: "John",
        email: "a@b.com",
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContain("Message must be at least 10 characters.");
      }
    });

    it("rejects message under 10 chars", () => {
      const result = validateContact({
        name: "John",
        email: "a@b.com",
        message: "Short",
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContain("Message must be at least 10 characters.");
      }
    });

    it("rejects message over 5000 chars", () => {
      const result = validateContact({
        name: "John",
        email: "a@b.com",
        message: "x".repeat(5001),
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContain("Message must be under 5,000 characters.");
      }
    });

    it("accepts message exactly 10 chars", () => {
      const result = validateContact({
        name: "John",
        email: "a@b.com",
        message: "0123456789",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("malformed input", () => {
    it("rejects null", () => {
      const result = validateContact(null);
      expect(result.valid).toBe(false);
    });

    it("rejects array", () => {
      const result = validateContact(["a", "b"]);
      expect(result.valid).toBe(false);
    });

    it("rejects string", () => {
      const result = validateContact("hello");
      expect(result.valid).toBe(false);
    });
  });

  it("returns multiple errors at once", () => {
    const result = validateContact({
      name: "",
      email: "bad",
      message: "short",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    }
  });
});
