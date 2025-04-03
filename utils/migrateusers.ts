// import {
//   arrayBufferToBase64,
//   generateAESKey,
//   generateKeyPair,
// } from "./cryptoHelpers";
// import { encryptPrivateKey } from "./utils";

// export async function migrateUsers() {
//   try {
//     // Step 1: Fetch users needing updates
//     const fetchResponse = await fetch("/api/users/needing-update", {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // Adjust auth as needed
//       },
//     });

//     const fetchData = await fetchResponse.json();
//     if (fetchData.status !== "ok" || !fetchData.users.length) {
//       console.log("No users need updating");
//       return { status: "ok", message: "No users need updating" };
//     }

//     const users = fetchData.users;

//     // Step 2: Generate crypto data for each user
//     const usersToUpdate = await Promise.all(
//       users.map(async (user: { _id: string; username: string }) => {
//         const { publicKey, privateKey } = await generateKeyPair();
//         const derivedKey = await generateAESKey();
//         const { encryptedPrivateKey, iv } = await encryptPrivateKey(
//           privateKey,
//           derivedKey
//         );

//         return {
//           _id: user._id,
//           publicKey,
//           encryptedPrivateKey,
//           derivedKey: arrayBufferToBase64(
//             await crypto.subtle.exportKey("raw", derivedKey)
//           ),
//           iv,
//         };
//       })
//     );

//     // Step 3: Send to API
//     const updateResponse = await fetch("/api/migrate-users", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // Adjust auth as needed
//       },
//       body: JSON.stringify({ usersToUpdate }),
//     });

//     const updateData = await updateResponse.json();
//     if (updateData.status === "ok") {
//       console.log(updateData.message);
//       return updateData;
//     } else {
//       throw new Error(updateData.message || "Migration failed");
//     }
//   } catch (error) {
//     console.error("Migration error:", error);
//     throw error;
//   }
// }

// // Example usage in a component
// export async function handleMigrateUsers() {
//   try {
//     const result = await migrateUsers();
//     // Show toast or log success
//     console.log(result.message);
//   } catch (error) {
//     // Handle error (e.g., show toast)
//     console.error("Failed to migrate users:", error);
//   }
// }
