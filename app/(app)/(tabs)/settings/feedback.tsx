import { Button } from "@/components/ui/button";
import { Form, FormField, FormInput, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const giveFeedbackSchema = z.object({
	title: z.string().min(3, { message: "Enter a valid title" }),
	body: z.string().min(3, { message: "Enter a valid message" }),
	email: z
		.string()
		.email({ message: "Enter a valid email" })
		.optional()
		.nullable()
		.transform((val) => {
			return val && val?.trim().length === 0 ? null : val?.trim();
		}),
});

const emailCheck = z.string().email();

export default function FeedbackPage() {
	const submitFeedback = useMutation(api.feedback.mutations.createFeedback);
	const { type } = useGlobalSearchParams<{ type: "feature" | "issue" }>();
	const navigateRef = useRef(true);
	const scrollViewRef = useRef<ScrollView>(null);

	const router = useRouter();

	useEffect(() => {
		const canNavigate = navigateRef.current;
		if (canNavigate) {
			return;
		}
		return () => {
			navigateRef.current = false;
		};
	}, []);

	const form = useForm<z.infer<typeof giveFeedbackSchema>>({
		resolver: zodResolver(giveFeedbackSchema),
		defaultValues: {
			title: "",
			body: "",
			email: "",
		},
	});

	const pending = form.formState.isSubmitting || form.formState.isValidating;

	const onSubmit = async (data: z.infer<typeof giveFeedbackSchema>) => {
		const { title, body, email } = data;
		let emailToSubmit = null;
		const emailResult = emailCheck.safeParse(email);
		if (emailResult.success) {
			emailToSubmit = email;
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
		await submitFeedback({
			type,
			title,
			body,
			email: emailToSubmit,
		});
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

		if (navigateRef.current) {
			router.replace("/settings");
		}
	};

	return (
		<SafeAreaView className="flex-1 flex flex-col gap-y-12 bg-background" edges={["top", "bottom", "left", "right"]}>
			<KeyboardAvoidingView className="flex-1" behavior={"padding"} keyboardVerticalOffset={0}>
				<ScrollView
					ref={scrollViewRef}
					className="flex-1"
					keyboardShouldPersistTaps="handled"
					alwaysBounceVertical={false}
					showsVerticalScrollIndicator={false}
				>
					<View className="w-full flex flex-col items-center">
						<View className="w-full flex flex-col gap-y-2 p-4 pt-8 items-center">
							<Text className="text-foreground text-xl font-medium">
								{type === "feature" ? "Request a Feature" : "Report a Bug"}
							</Text>
							<Text className="text-foreground/80 text-base w-2/3 text-center">
								Help us improve the app! We want to hear from you.
							</Text>
						</View>
						<View className="w-full h-[0.5px] bg-border" />
					</View>
					<View className="w-full flex flex-col gap-y-4 px-4 flex-1">
						<Form {...form}>
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem className="w-full mt-5">
										<FormInput
											onFocus={(e) => {
												scrollViewRef.current?.scrollTo({ y: 0, animated: true });
											}}
											disabled={pending}
											label="Title"
											{...field}
											description="Something short..."
											placeholder="Enter a title"
											className={cn(pending && "opacity-50")}
										/>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem className="w-full mt-5">
										<FormInput
											onFocus={(e) => {
												scrollViewRef.current?.scrollTo({ y: 0, animated: true });
											}}
											disabled={pending}
											label="Email"
											description="Optional"
											{...field}
											keyboardType={"email-address"}
											autoCapitalize={"none"}
											value={field.value ?? ""}
											placeholder="your email"
											className={cn(pending && "opacity-50")}
										/>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="body"
								render={({ field }) => (
									<FormItem className="w-full mt-5">
										<FormLabel nativeID="message-label" disabled={pending}>
											Message
										</FormLabel>
										<Textarea
											onFocus={(e) => {
												scrollViewRef.current?.scrollTo({ y: 150, animated: true });
											}}
											onChangeText={(text) => {
												form.setValue("body", text);
											}}
											value={field.value ?? ""}
											placeholder={type === "feature" ? "What would you like to see?" : "What went wrong?"}
											className={cn(
												"w-full text-foreground rounded h-36 border-[0.5px] border-primary bg-black/10 placeholder:text-foreground/60 focus:border-2 focus:border-border",
												pending && "opacity-50",
											)}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
						</Form>
						<View className="w-full flex py-6  mt-auto ">
							<Button
								disabled={pending}
								className="w-full bg-secondary border border-border rounded-2xl flex flex-col shadow"
								onPress={() => {
									form.handleSubmit(onSubmit)();
								}}
							>
								{pending ? (
									<ActivityIndicator size="small" color={"#0395ff"} />
								) : (
									<Text className="text-border text-base font-bold">{"Submit"}</Text>
								)}
							</Button>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
