import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_USERS = [
  {
    email: "info@gentlemenscut.com",
    password: "Password123!",
    fullName: "Gentlemen's Cut Owner",
    role: "owner",
    shopId: "11111111-1111-1111-1111-111111111111",
  },
  {
    email: "moseiboakye@st.knust.edu.gh",
    password: "Password123!",
    fullName: "Martin Osei Boakye",
    role: "admin",
  },
  {
    email: "kojo@gentlemenscut.com",
    password: "Password123!",
    fullName: "Kojo Mensah",
    role: "staff",
    staffId: "22222222-2222-2222-2222-222222222221",
  },
  {
    email: "kwame@gentlemenscut.com",
    password: "Password123!",
    fullName: "Kwame Asante",
    role: "staff",
    staffId: "22222222-2222-2222-2222-222222222222",
  },
  {
    email: "emmanuel@gentlemenscut.com",
    password: "Password123!",
    fullName: "Emmanuel Osei",
    role: "staff",
    staffId: "22222222-2222-2222-2222-222222222223",
  },
];

async function seedAuth() {
  console.log("Seeding demo auth users in Supabase...");

  for (const u of DEMO_USERS) {
    // 1. Try to find existing user by email
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData?.users.find((user) => user.email === u.email);

    let userId: string;

    if (existing) {
      console.log(`User ${u.email} already exists (${existing.id}), updating password...`);
      const { data: updateData, error: updateErr } = await supabase.auth.admin.updateUserById(
        existing.id,
        {
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.fullName },
        }
      );
      if (updateErr) {
        console.error(`Error updating ${u.email}:`, updateErr.message);
        continue;
      }
      userId = updateData.user.id;
    } else {
      console.log(`Creating user ${u.email}...`);
      const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });

      if (createErr) {
        console.error(`Error creating ${u.email}:`, createErr.message);
        continue;
      }
      userId = createData.user.id;
    }

    // 2. Link user_id to domain tables
    if (u.role === "owner" && u.shopId) {
      console.log(`Linking shop ${u.shopId} to owner ${userId}...`);
      const { error: shopErr } = await supabase
        .from("shops")
        .update({ owner_id: userId })
        .eq("id", u.shopId);
      if (shopErr) console.error("Error linking shop owner:", shopErr.message);
    }

    if (u.role === "admin") {
      console.log(`Linking platform_admins to admin ${userId}...`);
      const { error: adminErr } = await supabase
        .from("platform_admins")
        .update({ user_id: userId })
        .eq("email", u.email);
      if (adminErr) console.error("Error linking platform admin:", adminErr.message);
    }

    if (u.role === "staff" && u.staffId) {
      console.log(`Linking staff ${u.staffId} to staff user ${userId}...`);
      const { error: staffErr } = await supabase
        .from("staff")
        .update({ user_id: userId })
        .eq("id", u.staffId);
      if (staffErr) console.error("Error linking staff user:", staffErr.message);
    }
  }

  console.log("Demo auth users seeded successfully!");
}

seedAuth()
  .catch((err) => {
    console.error("Fatal seed error:", err);
    process.exit(1);
  });
