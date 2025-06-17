import { forms, forms_v1 } from "@googleapis/forms";
import { GoogleAuth, JWT } from "google-auth-library";
import { google } from "googleapis";
import fs from "fs";

interface FormField {
  name: string;
  type:
    | "text"
    | "dropdown"
    | "radio"
    | "checkbox"
    | "multipleChoice"
    | "choiceGrid"
    | "scale"
    | "paragraph";
  options?: string[];
  entryId: string; // The ID for URL pre-filling
  subject: string;
  level: string;
}

interface FormData {
  title: string;
  description: string;
  fields: FormField[];
}

interface FormEntry {
  form_code: string;
  subject: string;
  stream: string;
}

class GoogleFormExtractor {
  private formsClient!: forms_v1.Forms;
  private formId: string;

  constructor(formId: string) {
    this.formId = formId;
  }

  async initialize() {
    // Initialize Google Forms API with Service Account
    try {
      if (
        !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !process.env.GOOGLE_PRIVATE_KEY
      ) {
        throw new Error(
          "Google service account credentials (EMAIL, PRIVATE_KEY) are not set in environment variables."
        );
      }

      const auth = new GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      this.formsClient = forms({ version: "v1", auth });
    } catch (error: any) {
      throw new Error(
        `Failed to initialize Google Forms API: ${error.message}`
      );
    }
  }

  async extractFormData(
    subject: string,
    stream: string
  ): Promise<{
    form_data: FormEntry[];
    form_fields: FormField[];
  }> {
    try {
      const form_data: FormEntry[] = [];
      const form_fields: FormField[] = [];
      const response = await this.formsClient.forms.get({
        formId: this.formId,
      });

      const form = response.data;

      if (form.items) {
        for (const item of form.items) {
          const field = this.parseFormItem(item, false, subject);
          if (field) {
            field.options?.map((formOption) => {
              form_data.push({
                subject,
                form_code: formOption,
                stream,
              });
            });
            form_fields.push(field);
          }
        }
      }

      return { form_data, form_fields };
    } catch (error) {
      console.error("Error fetching form data:", error);
      throw error;
    }
  }

  async extractSecondaryFormData(stream: string): Promise<{
    form_data: FormEntry[];
    form_fields: FormField[];
  }> {
    try {
      const form_data: FormEntry[] = [];
      const form_fields: FormField[] = [];
      const response = await this.formsClient.forms.get({
        formId: this.formId,
      });

      const form = response.data;
      // console.log("STREAM: ", stream);

      if (form.items) {
        for (const item of form.items) {
          const field = this.parseFormItem(item, true);
          if (field) {
            field.options?.map((formOption) => {
              if (formOption.includes("Unable")) {
                return;
              }
              form_data.push({
                subject: field.subject ?? "error",
                form_code: formOption,
                stream,
              });
            });
            form_fields.push(field);
          }
        }
      }

      return { form_data, form_fields };
    } catch (error) {
      console.error("Error fetching form data:", error);
      throw error;
    }
  }

  private parseFormItem(
    item: forms_v1.Schema$Item,
    isSecondary: boolean = false,
    subject?: string
  ): FormField | null {
    if (!item.title || !item.questionItem?.question?.questionId) {
      return null;
    }

    const englishSubjects = ["English", "IP English"];
    const mathSubjects = [
      "E Math",
      "A Math",
      "IP Math",
      "IP Mathematics",
      "Math",
      "Mathematics",
    ];
    const scienceSubjects = [
      "IP Science",
      "Science",
      "IP Biology",
      "Biology",
      "Pure Biology",
      "Combined Biology",
      "IP Chemistry",
      "Chemistry",
      "Pure Chemistry",
      "Combined Chemistry",
      "IP Physics",
      "Physics",
      "Pure Physics",
      "Combined Physics",
    ];

    const allSubjects = [
      ...englishSubjects,
      ...mathSubjects,
      ...scienceSubjects,
    ];

    if (
      isSecondary &&
      item.questionItem?.question?.choiceQuestion &&
      allSubjects.includes(item.title.trim())
    ) {
      // console.log(item.title);
      // console.log(
      //   item.questionItem?.question?.choiceQuestion?.options?.map(
      //     (opt) => opt.value
      //   ).length
      // );
      const question = item.questionItem.question;
      const field: FormField = {
        name: item.title.trim(),
        type: "text",
        // parse questionId from hexa to decimal
        entryId: parseInt(question.questionId!, 16).toString(),
        subject: item.title.trim(),
        level: "secondary",
      };

      // Parse different question types
      if (question.choiceQuestion) {
        field.type =
          question.choiceQuestion.type === "DROP_DOWN" ? "dropdown" : "radio";
        field.options =
          question.choiceQuestion.options?.map((opt) => opt.value!) || [];
      } else if (question.textQuestion) {
        field.type = question.textQuestion.paragraph ? "paragraph" : "text";
      } else if ((question as any)["checkboxQuestion"]) {
        field.type = "checkbox";
        field.options =
          (question as any)["checkboxQuestion"].options?.map(
            (opt: any) => opt.value!
          ) || [];
      } else if (question.scaleQuestion) {
        field.type = "scale";
      } else if ((question as any)["gridQuestion"]) {
        field.type = "choiceGrid";
      }

      return field;
    } else {
      if (
        item.title !== "(J2) Select your Preferred Slot" &&
        item.title !== "(J1) Select your Preferred Slot"
      ) {
        return null;
      }

      const question = item.questionItem.question;
      const field: FormField = {
        name: item.title,
        type: "text",
        // parse questionId from hexa to decimal
        entryId: parseInt(question.questionId!, 16).toString(),
        subject: subject ?? "error",
        level: "JC",
      };

      // Parse different question types
      if (question.choiceQuestion) {
        field.type =
          question.choiceQuestion.type === "DROP_DOWN" ? "dropdown" : "radio";
        field.options =
          question.choiceQuestion.options?.map((opt) => opt.value!) || [];
      } else if (question.textQuestion) {
        field.type = question.textQuestion.paragraph ? "paragraph" : "text";
      } else if ((question as any)["checkboxQuestion"]) {
        field.type = "checkbox";
        field.options =
          (question as any)["checkboxQuestion"].options?.map(
            (opt: any) => opt.value!
          ) || [];
      } else if (question.scaleQuestion) {
        field.type = "scale";
      } else if ((question as any)["gridQuestion"]) {
        field.type = "choiceGrid";
      }

      return field;
    }
  }
}

async function updateGoogleSheet(data: FormEntry[]) {
  console.log(`\n🔄 Updating Google Sheet with ${data.length} rows...`);

  if (
    !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    !process.env.GOOGLE_PRIVATE_KEY ||
    !process.env.SCHEDULING_MASTER_DATA_SPREADSHEET_ID ||
    !process.env.FORM_OPTIONS_SHEET_NAME
  ) {
    throw new Error(
      "❌ Missing required environment variables. Make sure GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, SCHEDULING_MASTER_DATA_SPREADSHEET_ID and FORM_OPTIONS_SHEET_NAME are set in your .env file."
    );
  }

  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });

    const sheets = google.sheets({ version: "v4", auth: serviceAccountAuth });
    const spreadsheetId = process.env.SCHEDULING_MASTER_DATA_SPREADSHEET_ID;
    const formDataName = process.env.FORM_OPTIONS_SHEET_NAME;
    const sheetId = process.env.FORM_OPTIONS_SHEET_ID;

    //Wipe previous data
    const res = await sheets.spreadsheets.values.batchClear({
      spreadsheetId,
      requestBody: {
        ranges: [`${formDataName}!A2:C1000`],
      },
    });
    if (res.status !== 200) {
      console.error("❌ Error wiping previous data:", res.statusText);
    } else {
      console.log("✅ Previous data wiped successfully");
    }

    const now = new Date().toLocaleString("en-SG", {
      timeZone: "Asia/Singapore",
    });
    const updateRes = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        data: [
          {
            majorDimension: "ROWS",
            range: `${formDataName}!A2:C1000`,
            values: data.map((item) => [
              item.form_code,
              item.subject,
              item.stream,
            ]),
          },
          {
            majorDimension: "ROWS",
            range: `${formDataName}!E1`,
            values: [[`Last Updated At: ${now}`]],
          },
        ],
        valueInputOption: "USER_ENTERED",
      },
    });
    if (updateRes.status !== 200) {
      console.error("❌ Error updating data:", updateRes.statusText);
    } else {
      console.log("✅ Data updated successfully");
    }
  } catch (error: any) {
    console.error("❌ Error updating Google Sheet:", error.message);
    throw error;
  }
}

export async function extractFormData(
  stream: string,
  formId: string,
  subject?: string
): Promise<{ formData: FormEntry[]; formFields: FormField[] } | null> {
  try {
    const extractor = new GoogleFormExtractor(formId);
    await extractor.initialize();
    let formData: FormEntry[] | null = null;
    let formFields: FormField[] | null = null;
    if (stream === "JC" && subject) {
      const { form_data, form_fields } = await extractor.extractFormData(
        subject,
        stream
      );
      formData = form_data;
      formFields = form_fields;
    } else {
      const { form_data, form_fields } =
        await extractor.extractSecondaryFormData(stream);
      formData = form_data;
      formFields = form_fields;
    }
    if (formData) {
      return { formData, formFields };
    } else {
      console.error("No form data found");
      return { formData: [], formFields: [] };
    }
  } catch (error: any) {
    console.warn("Failed to fetch from Google Forms API, error:", error);
    return null;
  }
}

export function getFormDataAsJSON(formData: FormData): string {
  return JSON.stringify(formData, null, 2);
}

export const handler = async () => {
  try {
    const jcFormIds = {
      Economics: "13LY71ZQAhLeJE0zkTjuGjYIeRyVst2E9f3Wg4o3VZ54",
      Chemistry: "1Tlrqn0J7YGJVGU4bqmkr3--ui2SH9q2IsTwgQP9EcHw",
      Mathematics: "1MEVouE4DVpUIrhtC31prKS6lBWKJ0nQRYkyJe7n6GlU",
      Biology: "1W9lY0N0fy_u7YgBB7vP7yKa3xAxHlkEyfmR6yFcWaSI",
      Physics: "1kEnJDNuF4D0lvfeTP7nR8IyE4YnSZpAEaJkYZBhQm2I",
      "General Paper": "1ziNR30SHVj6fJkRT8xGtY6WOVID2UKZemxbwb5OZbD8",
    };

    const form_data: FormEntry[] = [];
    const form_fields: FormField[] = [];

    for (const [subject, value] of Object.entries(jcFormIds)) {
      console.log(`Fetching ${subject} form data from Google Forms API...`);
      const formData = await extractFormData("JC", value, subject);
      if (formData) {
        form_data.push(...formData.formData);
        form_fields.push(...formData.formFields);
      } else {
        console.error("No form data found");
      }
    }

    // Secondary:
    const secondaryFormIds = {
      "Sec 1": "1r6PSvsf_9QYTBb5UL_hzCxPCL3Z8k28EYc4x-Xd-aoE",
      "Sec 2": "1PWW8Np5kkq5v0WwQvVNX0ObtN_EsNhOb4yggKzPXDwU",
      "Sec 3": "1aHpuJA2e2dP8eyh_U2WNUOXiQfi9x3LNy7R6iCRNdys",
      "Sec 4": "1GUPubKN1b8Xn6VJttz3PNTgJ7MDMOvNUxqMqeenWtX8",
    };

    for (const [stream, formId] of Object.entries(secondaryFormIds)) {
      console.log(`Fetching ${stream} form data from Google Forms API...`);
      const formData = await extractFormData(stream, formId);
      if (formData) {
        form_data.push(...formData.formData);
        form_fields.push(...formData.formFields);
      } else {
        console.error("No form data found");
      }
    }

    await updateGoogleSheet(form_data);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form_fields,
      }),
    };
  } catch (error: any) {
    console.error("An error occurred in the handler:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "An error occurred during execution.",
        error: error.message,
      }),
    };
  }
};

if (require.main === module) {
  handler();
}
