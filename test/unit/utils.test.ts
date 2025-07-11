import { camelCase, upperFirst, snakeCase } from "../../src/utils";
import {
  pascalCase,
  singularUpperCase,
  singularPascalCase,
} from "../../src/utils";

describe("utils replacements", () => {
  describe("pascalCase", () => {
    it("should convert snake_case to PascalCase", () => {
      expect(pascalCase("hello_world_test")).toBe("HelloWorldTest");
    });
    it("should convert kebab-case to PascalCase", () => {
      expect(pascalCase("hello-world-test")).toBe("HelloWorldTest");
    });
    it("should handle single word", () => {
      expect(pascalCase("hello")).toBe("Hello");
    });
    it("should handle spaces", () => {
      expect(pascalCase("hello world test")).toBe("HelloWorldTest");
    });
  });

  describe("singularUpperCase", () => {
    it("should singularize and uppercase snake_case table names", () => {
      expect(singularUpperCase("accounts_users")).toBe("ACCOUNT_USER");
      expect(singularUpperCase("tracks_accounts")).toBe("TRACK_ACCOUNT");
    });
    it("should handle already singular names", () => {
      expect(singularUpperCase("artist_account")).toBe("ARTIST_ACCOUNT");
    });
    it("should handle single word", () => {
      expect(singularUpperCase("albums")).toBe("ALBUM");
    });
  });

  describe("singularPascalCase", () => {
    it("should singularize and PascalCase table names", () => {
      expect(singularPascalCase("accounts_users")).toBe("AccountUser");
      expect(singularPascalCase("tracks_accounts")).toBe("TrackAccount");
    });
    it("should handle already singular names", () => {
      expect(singularPascalCase("artist_account")).toBe("ArtistAccount");
    });
    it("should handle single word", () => {
      expect(singularPascalCase("albums")).toBe("Album");
    });
    it("should handle uppercase snake case", () => {
      expect(singularPascalCase("ARTIST_ALBUMS")).toBe("ArtistAlbum");
    });
  });
  describe("camelCase", () => {
    it("should convert snake_case to camelCase", () => {
      expect(camelCase("hello_world_test")).toBe("helloWorldTest");
    });
    it("should convert kebab-case to camelCase", () => {
      expect(camelCase("hello-world-test")).toBe("helloWorldTest");
    });
    it("should handle single word", () => {
      expect(camelCase("hello")).toBe("hello");
    });
    it("should handle spaces", () => {
      expect(camelCase("hello world test")).toBe("helloWorldTest");
    });
  });

  describe("upperFirst", () => {
    it("should uppercase the first letter", () => {
      expect(upperFirst("hello")).toBe("Hello");
    });
    it("should not change already capitalized", () => {
      expect(upperFirst("Hello")).toBe("Hello");
    });
    it("should handle empty string", () => {
      expect(upperFirst("")).toBe("");
    });
  });

  describe("snakeCase", () => {
    it("should convert camelCase to snake_case", () => {
      expect(snakeCase("helloWorldTest")).toBe("hello_world_test");
    });
    it("should convert kebab-case to snake_case", () => {
      expect(snakeCase("hello-world-test")).toBe("hello_world_test");
    });
    it("should handle spaces", () => {
      expect(snakeCase("hello world test")).toBe("hello_world_test");
    });
    it("should handle already snake_case", () => {
      expect(snakeCase("hello_world_test")).toBe("hello_world_test");
    });
  });
});
