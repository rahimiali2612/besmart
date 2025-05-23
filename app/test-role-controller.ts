import { fetch } from "bun";

// Test users and their expected permissions
const testUsers = [
  //   {
  //     email: "alice@example.com",
  //     password: "password", // Replace with real password if needed
  //     expectAdmin: true,
  //     expectRoles: ["admin", "user"],
  //   },
  //   {
  //     email: "bob@example.com",
  //     password: "password", // Replace with real password if needed
  //     expectAdmin: false,
  //     expectRoles: ["user", "staff"],
  //   },
  {
    email: "la@gmail.com",
    password: "12345", // Replace with real password if needed
    expectAdmin: false,
    expectRoles: ["admin", "user"],
  },
];

async function testRoleController() {
  for (const user of testUsers) {
    console.log(`\n--- Testing as ${user.email} ---`);
    // 1. Login
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.log(`Login failed for ${user.email}:`, loginData);
      continue;
    }
    const token = loginData.token;
    console.log(`Login success. Roles:`, loginData.user.roles);

    // 2. Test GET /api/roles (admin only)
    const rolesRes = await fetch("http://localhost:3000/api/roles", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rolesData = await rolesRes.json();
    if (user.expectAdmin) {
      if (rolesRes.status === 200 && Array.isArray(rolesData)) {
        console.log("✓ /api/roles: Success for admin");
      } else {
        console.error(
          "✗ /api/roles: Should succeed for admin, got:",
          rolesRes.status,
          rolesData
        );
      }
    } else {
      if (rolesRes.status === 403 && rolesData.error) {
        console.log("✓ /api/roles: Forbidden for non-admin");
      } else {
        console.error(
          "✗ /api/roles: Should be forbidden for non-admin, got:",
          rolesRes.status,
          rolesData
        );
      }
    }

    // 3. Test GET /api/roles/user/:userId (self and admin)
    const userId = loginData.user.id;
    const selfRolesRes = await fetch(
      `http://localhost:3000/api/roles/user/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const selfRolesData = await selfRolesRes.json();
    if (selfRolesRes.status === 200 && selfRolesData.roles) {
      console.log(
        "✓ /api/roles/user/:userId (self):",
        selfRolesData.roles.map((r: any) => r.name)
      );
    } else {
      console.error(
        "✗ /api/roles/user/:userId (self):",
        selfRolesRes.status,
        selfRolesData
      );
    }

    // 4. Test POST /api/roles/user/:userId/assign (admin only)
    const assignRes = await fetch(
      `http://localhost:3000/api/roles/user/${userId}/assign`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roleName: "staff" }),
      }
    );
    const assignData = await assignRes.json();
    if (user.expectAdmin) {
      if (assignRes.status === 200 && assignData.roles) {
        console.log("✓ /api/roles/user/:userId/assign: Success for admin");
      } else {
        console.error(
          "✗ /api/roles/user/:userId/assign: Should succeed for admin, got:",
          assignRes.status,
          assignData
        );
      }
    } else {
      if (assignRes.status === 403 && assignData.error) {
        console.log(
          "✓ /api/roles/user/:userId/assign: Forbidden for non-admin"
        );
      } else {
        console.error(
          "✗ /api/roles/user/:userId/assign: Should be forbidden for non-admin, got:",
          assignRes.status,
          assignData
        );
      }
    }

    // 5. Test POST /api/roles/user/:userId/remove (admin only)
    const removeRes = await fetch(
      `http://localhost:3000/api/roles/user/${userId}/remove`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roleName: "staff" }),
      }
    );
    const removeData = await removeRes.json();
    if (user.expectAdmin) {
      if (removeRes.status === 200 && removeData.roles) {
        console.log("✓ /api/roles/user/:userId/remove: Success for admin");
      } else {
        console.error(
          "✗ /api/roles/user/:userId/remove: Should succeed for admin, got:",
          removeRes.status,
          removeData
        );
      }
    } else {
      if (removeRes.status === 403 && removeData.error) {
        console.log(
          "✓ /api/roles/user/:userId/remove: Forbidden for non-admin"
        );
      } else {
        console.error(
          "✗ /api/roles/user/:userId/remove: Should be forbidden for non-admin, got:",
          removeRes.status,
          removeData
        );
      }
    }
  }
}

testRoleController();
