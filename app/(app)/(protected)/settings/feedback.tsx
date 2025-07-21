import { Form, FormDescription, FormField, FormInput, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGlobalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";

const giveFeedbackSchema = z.object({
	title: z.string().min(3, { message: "Enter a valid title" }),
	body: z.string().min(10, { message: "Enter a valid body" }),
	email: z.string(),
});

export default function FeedbackPage() {
	const { type } = useGlobalSearchParams<{ type: "feature" | "issue" }>();
	console.log(type);

	const form = useForm<z.infer<typeof giveFeedbackSchema>>({
		resolver: zodResolver(giveFeedbackSchema),
		defaultValues: {
			title: "",
			body: "",
			email: "",
		},
	});

	// const pending = form.formState.isSubmitting || form.formState.isValidating;

	const onSubmit = async (data: z.infer<typeof giveFeedbackSchema>) => {
		console.log(data);
	};

	return (
		<View className="flex-1 flex flex-col gap-y-12">
			<View className="flex-1 flex flex-col gap-y-4">
				<Text>Feedback</Text>
			</View>
			<Form {...form}>
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem className="w-full mt-5">
							<FormInput
								{...field}
								placeholder="Enter a title"
								className="w-full border border-zinc-600 bg-[#3A3A3A] rounded-xl text-zinc-200 items-center"
								placeholderTextColor="white"
							/>
							<FormDescription className="text-zinc-400">{"Something short..."}</FormDescription>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem className="w-full mt-5">
							<FormInput
								{...field}
								placeholder="your email"
								className="w-full border border-zinc-600 bg-[#3A3A3A] rounded-xl text-zinc-200 items-center"
								placeholderTextColor="white"
							/>
							<FormDescription className="text-zinc-400">{"Optional"}</FormDescription>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="body"
					render={({ field }) => (
						<FormItem className="w-full mt-5">
							<Textarea
								{...field}
								placeholder={type === "feature" ? "What would you like to see?" : "What went wrong?"}
								className="w-full border border-zinc-600 bg-[#3A3A3A] rounded-xl text-zinc-200 items-center"
								placeholderTextColor="white"
							/>
						</FormItem>
					)}
				/>
			</Form>
		</View>
	);
}
