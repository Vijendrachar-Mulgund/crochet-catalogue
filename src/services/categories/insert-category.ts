import { useUserStore } from "../../store/user";
import { useCategoriesStore } from "../../store/categories";
import { insert } from "../../services/database/insert";

export async function InsertCategory(categoryName: string) {
  try {
    if (!categoryName) return;

    const userID = useUserStore.getState().userID;
    const prevCategories = useCategoriesStore.getState().categories;

    const payload = {
      tableName: "category",
      data: {
        category_name: categoryName,
        user_id: userID,
      },
    };

    const { data, error } = await insert(payload);

    if (error) {
      console.error("An error occurred during category insertion: ", error);
      return false;
    }

    useCategoriesStore.setState({ categories: [...prevCategories, ...data] });
    console.log("Category successfully inserted", { data, prevCategories });
  } catch (error) {
    console.error("Something went wrong: ", error);
  }
}
