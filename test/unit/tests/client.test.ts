import { createClient } from "../../../src/client";

describe("createClient", () => {
  it("should create a pg Client with correct config", () => {
    const client = createClient({
      connectionString: "postgres://foo:bar@localhost:5432/db",
      ssl: true,
    });

    expect(client.ssl).toBe(true);
    expect(client.user).toBe("foo");
    expect(client.password).toBe("bar");
    expect(client.host).toBe("localhost");
    expect(client.port).toBe(5432);
    expect(client.database).toBe("db");
  });
});
