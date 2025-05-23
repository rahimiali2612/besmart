import { fetch } from "bun";

async function testRBACLogin() {
  const testUsers = [
    { email: "la@gmail.com", password: "12345" }, // Replace with real password if needed
  ];

  for (const { email, password } of testUsers) {
    console.log(`\n--- Testing login for ${email} ---`);
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.log(`Login failed for ${email}:`, loginData);
      continue;
    }
    console.log(`Login success for ${email}`);
    console.log("User:", loginData.user);
    console.log("Roles:", loginData.user.roles);
    console.log("Token:", loginData.token ? "Yes" : "No");

    // Test RBAC-protected endpoint (e.g. /api/roles)
    const rolesRes = await fetch("http://localhost:3000/api/roles", {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const rolesData = await rolesRes.json();
    console.log(`GET /api/roles status: ${rolesRes.status}`);
    console.log("Response:", rolesData);
  }
}

testRBACLogin();
