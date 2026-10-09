import { createClient } from "@/lib/supabase/server";
import LogForm from "./LogForm";

export default async function LogPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return <div>You must be logged in.</div>;
    }

    const [
        platformsResult,
        brandsResult,
        categoriesResult,
        profileResult,
    ] = await Promise.all([
        supabase
            .from("platforms")
            .select("id, name")
            .eq("is_active", true)
            .order("name"),

        supabase
            .from("brands")
            .select("id, name")
            .eq("is_active", true)
            .order("name"),

        supabase
            .from("inquiry_categories")
            .select(`
                id,
                name,
                inquiry_main_categories (
                    id,
                    name,
                    inquiry_sub_categories (
                        id,
                        name
                    )
                )
            `)
            .order("name"),

        supabase
            .from("profiles")
            .select("id, full_name, email, role")
            .eq("id", user.id)
            .single(),
    ]);

    return (
        <LogForm
            platforms={platformsResult.data ?? []}
            brands={brandsResult.data ?? []}
            categories={categoriesResult.data ?? []}
            currentUser={profileResult.data}
        />
    );
}