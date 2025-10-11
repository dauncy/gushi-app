import { FormHeader } from "@/components/nav/form-header";
import { Form, FormField, FormInput, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toastConfig } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";
import { usePreventFormDismiss } from "@/hooks/use-prevent-form-dismiss";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Keyboard, KeyboardAvoidingView, ScrollView, View } from "react-native";
import Toast from "react-native-toast-message";
import { z } from "zod";

const giveFeedbackSchema = z.object({
	title: z.string().min(3, { message: "Enter a valid title" }),
	body: z.string().min(3, { message: "Enter a valid message" }),
	email: z
		.string()
		.transform((val) => {
			return (val ?? "")?.trim().length === 0 ? null : val?.trim();
		})
		.optional()
		.nullable(),
});

const emailCheck = z.string().email();

const ALERT_TITLE = "Discard Changes";
const ALERT_MESSAGE_ISSUE = "Are you sure you want to cancel this report?";
const ALERT_MESSAGE_FEATURE = "Are you sure you want to cancel this feedback?";

export default function FeedbackPage() {
	const submitFeedback = useMutation(api.feedback.mutations.createFeedback);
	const { type } = useGlobalSearchParams<{ type: "feature" | "issue" }>();
	const scrollViewRef = useRef<ScrollView>(null);

	const router = useRouter();

	const form = useForm<z.infer<typeof giveFeedbackSchema>>({
		resolver: zodResolver(giveFeedbackSchema),
		defaultValues: {
			title: "",
			body: "",
			email: "",
		},
	});

	const { title, body, email } = form.watch();

	const isDirty = useMemo(() => {
		return title.trim().length > 0 || body.trim().length > 0 || (email?.trim() ?? "").length > 0;
	}, [title, body, email]);

	const submitDisabled = useMemo(() => {
		return title.trim().length <= 2 || body.trim().length <= 2;
	}, [title, body]);

	const pending = form.formState.isSubmitting || form.formState.isLoading;

	const onSubmit = useCallback(
		async (data: z.infer<typeof giveFeedbackSchema>) => {
			const { title, body, email } = data;
			Keyboard.dismiss();
			let emailToSubmit = null;
			if ((email ?? "").trim().length > 0) {
				const emailResult = emailCheck.safeParse(email);
				if (emailResult.success) {
					emailToSubmit = email;
				} else {
					form.setError("email", { message: "Enter a valid email" });
					await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
					return;
				}
			}

			await submitFeedback({
				type,
				title,
				body,
				email: emailToSubmit,
			});
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			const text1 = type === "feature" ? "Feedback submitted" : "Issue reported";
			const text2 = type === "feature" ? "Thank you for your feedback!" : "Thank you for your report!";
			Toast.show({ type: "success", text1, text2 });
			router.dismissTo("/settings");
		},
		[form, submitFeedback, type, router],
	);

	const handleSubmit = useCallback(async () => {
		await form.handleSubmit(onSubmit)();
	}, [form, onSubmit]);

	usePreventFormDismiss({
		isDirty,
		alertTitle: ALERT_TITLE,
		alertMessage: type === "feature" ? ALERT_MESSAGE_FEATURE : ALERT_MESSAGE_ISSUE,
	});

	return (
		<>
			<KeyboardAvoidingView behavior={"padding"} keyboardVerticalOffset={0} className="flex-1 bg-background">
				<ScrollView
					ref={scrollViewRef}
					className="flex-1 bg-background "
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingBottom: 80 }}
				>
					<FormHeader
						isDirty={isDirty}
						submitDisabled={submitDisabled}
						backDisabled={pending}
						dismissTo="/settings"
						formTitle="Feedback"
						alertTitle={ALERT_TITLE}
						alertMessage={type === "feature" ? ALERT_MESSAGE_FEATURE : ALERT_MESSAGE_ISSUE}
						onSubmit={handleSubmit}
					/>
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
										<FormLabel nativeID="message-label" disabled={pending} className={cn(pending && "opacity-50")}>
											Message
										</FormLabel>
										<Textarea
											onFocus={(e) => {
												scrollViewRef.current?.scrollToEnd({ animated: true });
											}}
											onChangeText={(text) => {
												form.setValue("body", text);
											}}
											value={field.value ?? ""}
											placeholder={type === "feature" ? "What would you like to see?" : "What went wrong?"}
											className={cn(
												"w-full text-foreground rounded h-36 border-[0.5px] border-primary bg-foreground/10 placeholder:text-foreground/60 focus:border-2 focus:border-border",
												pending && "opacity-50",
											)}
										/>
										<FormMessage />
									</FormItem>
								)}
							/>
						</Form>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
			<Toast config={toastConfig} position={"top"} topOffset={48} />
		</>
	);
}
