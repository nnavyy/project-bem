
const { signToken } = require('./lib/auth');
const prisma = require('./lib/prisma').default;

async function testApi() {
  try {
    const superAdmin = await prisma.admin.findFirst({ where: { role: 'SUPER_ADMIN' } });
    const targetAdmin = await prisma.admin.findFirst({ where: { username: 'tes2' } });

    console.log("SuperAdmin:", superAdmin?.id);
    console.log("TargetAdmin:", targetAdmin?.id);

    const token = await signToken({
      id: superAdmin.id,
      role: superAdmin.role,
    });

    const res = await fetch('http://localhost:3000/api/headadmin/generate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tokenRole: 'HEAD_ADMIN',
        adminId: targetAdmin ? targetAdmin.id : null,
        isPermanent: true,
        isSingleUse: false,
      })
    });

    const body = await res.text();
    console.log("Response:", res.status, body);

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

testApi();
