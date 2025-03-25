import "dotenv/config";
import { db } from "@/lib/db";
import { requestTypes, groups } from "@/schemas/schema";
import { v4 as uuidv4 } from "uuid";

async function main() {
  console.log("🚀 Setting up database...");

  try {
    // Check if groups exist, create them if not
    console.log("👥 Checking groups...");
    const existingGroups = await db.select().from(groups);

    let itGroupId: string;
    let corporateGroupId: string;

    if (existingGroups.length === 0) {
      console.log("👥 Creating groups...");
      const itId = uuidv4();
      const corporateId = uuidv4();

      await db.insert(groups).values([
        {
          id: itId,
          name: "IT",
          description: "IT department with access to change requests",
        },
        {
          id: corporateId,
          name: "Corporate",
          description: "Corporate department with access to asset requests",
        },
      ]);

      itGroupId = itId;
      corporateGroupId = corporateId;
    } else {
      const itGroup = existingGroups.find((g) => g.name === "IT");
      const corporateGroup = existingGroups.find((g) => g.name === "Corporate");

      if (!itGroup || !corporateGroup) {
        console.error("❌ Required groups not found");
        process.exit(1);
      }

      itGroupId = itGroup.id;
      corporateGroupId = corporateGroup.id;
    }

    // Check if request types exist, create them if not
    console.log("📝 Checking request types...");
    const existingRequestTypes = await db.select().from(requestTypes);

    if (existingRequestTypes.length === 0) {
      console.log("📝 Creating request types...");
      await db.insert(requestTypes).values([
        {
          id: uuidv4(),
          name: "IT Change Request",
          description: "Request for changes to IT infrastructure or systems",
          groupId: itGroupId,
          schema: {
            fields: [
              { name: "title", type: "string", required: true },
              { name: "description", type: "text", required: true },
              {
                name: "changeType",
                type: "select",
                required: true,
                options: ["hardware", "software", "network", "other"],
              },
              {
                name: "priority",
                type: "select",
                required: true,
                options: ["low", "medium", "high", "critical"],
              },
              { name: "implementationDate", type: "date", required: true },
              { name: "impact", type: "text", required: true },
              { name: "rollbackPlan", type: "text", required: true },
              {
                name: "attachments",
                type: "file",
                required: false,
                multiple: true,
                accept: ["*/*"],
                maxSize: 10485760, // 10MB
              },
            ],
          },
        },
        {
          id: uuidv4(),
          name: "Asset Request",
          description: "Request for new hardware, software, or other assets",
          groupId: corporateGroupId,
          schema: {
            fields: [
              { name: "title", type: "string", required: true },
              {
                name: "assetType",
                type: "select",
                required: true,
                options: ["hardware", "software", "peripheral", "other"],
              },
              {
                name: "assetCategory",
                type: "select",
                required: true,
                options: [
                  "laptop",
                  "desktop",
                  "monitor",
                  "software",
                  "mobile",
                  "accessory",
                  "other",
                ],
              },
              { name: "quantity", type: "number", required: true, min: 1 },
              { name: "justification", type: "text", required: true },
              { name: "neededBy", type: "date", required: true },
              { name: "additionalInfo", type: "text", required: false },
            ],
          },
        },
      ]);
    }

    console.log("✅ Database setup completed successfully!");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
