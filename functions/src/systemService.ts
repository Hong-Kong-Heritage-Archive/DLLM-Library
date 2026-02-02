import { db, GetPublicUrlForGSFile } from "./platform";
import {
  CategoryMap,
  CategoryMapInput,
  HostConfig,
  HostConfigInput,
} from "./generated/graphql";

const SYSTEM_DB = db.collection("system");

export class SystemService {
  constructor() {
    // initialization for category maps if needed
    SYSTEM_DB.doc("category")
      .get()
      .then((categoryMapsRef) => {
        if (!categoryMapsRef.exists) {
          categoryMapsRef.ref.set({});
        }
      });
  }
  async getHostConfig(): Promise<HostConfig> {
    const hostConfigRef = await SYSTEM_DB.doc("hostConfig").get();
    let hostConfig: HostConfig;
    if (hostConfigRef.exists === false) {
      const defaultHostConfig: HostConfigInput = {
        aboutUsText: "Welcome to our platform!",
        chatLink: "https://chat.example.com", // provide default values here
        splashScreenText: "",
        splashScreenImageUrl: null,
      };
      hostConfig = await this.updateHostConfig(defaultHostConfig);
    } else {
      const data = hostConfigRef.data();
      hostConfig = data as HostConfig;
      hostConfig.splashScreenImageUrl = data?.splashScreenImageUrl || null;
      hostConfig.splashScreenText = data?.splashScreenText || "";
    }
    return hostConfig;
  }
  async updateHostConfig(
    hostConfigInput: HostConfigInput
  ): Promise<HostConfig> {
    const hostConfigRef = SYSTEM_DB.doc("hostConfig");
    console.log("Updating host config:", hostConfigInput);
    let updatedFields: any = hostConfigInput;
    if (updatedFields.splashScreenImageUrl === undefined) {
      updatedFields.splashScreenImageUrl = null;
    } else if (updatedFields.splashScreenImageUrl?.startsWith("gs://")) {
      try {
        const publicUrl = await GetPublicUrlForGSFile(
          updatedFields.splashScreenImageUrl
        );
        updatedFields.splashScreenImageGsLink =
          updatedFields.splashScreenImageUrl;
        updatedFields.splashScreenImageUrl = publicUrl;
      } catch (error) {
        console.error("Error getting public URL for GS file:", error);
      }
    }
    await hostConfigRef.set(updatedFields, { merge: true });
    return this.getHostConfig();
  }
  async upsertCategoryMap(
    en: string,
    categoryMaps: CategoryMapInput[]
  ): Promise<CategoryMap[]> {
    en = en.trim().toLowerCase();
    const categoryMapsRef = await SYSTEM_DB.doc("category")
      .collection("categoryMaps")
      .doc("categoryMap");

    let categoryMapData: any = {};
    let foundEn = false;
    for (const categoryMap of categoryMaps) {
      if (categoryMap.language === "en") {
        foundEn = true;
        continue; // Skip English as it's already handled
      }
      categoryMapData[categoryMap.language] = categoryMap.value;
    }
    let updatedCategoryMaps: any = {};
    updatedCategoryMaps[en] = categoryMapData;

    await categoryMapsRef.set(updatedCategoryMaps, { merge: true });
    return categoryMaps;
  }
  async addCategoryTree(
    parentPath: string | null,
    leafCategory: string
  ): Promise<string> {
    let newCategoryPath = "";
    if (parentPath && parentPath.trim() !== "") {
      newCategoryPath = `${parentPath}/${leafCategory}`;
    } else {
      newCategoryPath = leafCategory;
    }
    newCategoryPath = newCategoryPath.trim().toLowerCase();

    const categoryTreesRef = SYSTEM_DB.doc("category")
      .collection("categoryTrees")
      .doc("default");

    const categoryTreesDoc = await categoryTreesRef.get();
    let categoryTrees: string[] = [];
    if (categoryTreesDoc.exists) {
      const data = categoryTreesDoc.data();
      if (data && data.trees) {
        categoryTrees = data.trees;
      }
    }

    if (!categoryTrees.includes(newCategoryPath)) {
      categoryTrees.push(newCategoryPath);
      await categoryTreesRef.set({ trees: categoryTrees });
    }

    return newCategoryPath;
  }

  async getDefaultCategoryTrees(): Promise<string[]> {
    const categoryTreesRef = SYSTEM_DB.doc("category")
      .collection("categoryTrees")
      .doc("default");

    const categoryTreesDoc = await categoryTreesRef.get();
    let categoryTrees: string[] = [];
    if (categoryTreesDoc.exists) {
      const data = categoryTreesDoc.data();
      if (data && data.trees) {
        categoryTrees = data.trees;
      }
    }
    return categoryTrees;
  }

  async getAllCategoryMaps(): Promise<CategoryMap[][]> {
    const categoryMapsRef = await SYSTEM_DB.doc("category")
      .collection("categoryMaps")
      .doc("categoryMap")
      .get();

    if (!categoryMapsRef.exists) {
      return [];
    }
    const doc = categoryMapsRef.data();
    if (!doc) {
      return [];
    }
    const categoryMaps: CategoryMap[][] = [];
    for (const endKey in doc) {
      const data = doc[endKey];
      const categoryMap: [CategoryMap] = [
        {
          language: "en",
          value: endKey,
        },
      ];
      for (const key in data) {
        categoryMap.push({
          language: key,
          value: data[key],
        });
      }
      categoryMaps.push(categoryMap);
    }
    return categoryMaps;
  }
}
