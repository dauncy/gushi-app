import { Form, FormField, FormInput, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toastConfig } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePreventRemove } from "@react-navigation/native";
import { useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import { useGlobalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Alert, Keyboard, KeyboardAvoidingView, ScrollView, Text, TouchableOpacity, View } from "react-native";
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

export default function FeedbackPage() {
	const navigation = useNavigation();
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
					return;
				}
			}

			await submitFeedback({
				type,
				title,
				body,
				email: emailToSubmit,
			});
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

	usePreventRemove(true, (data) => {
		if (data.data.action.type === "POP_TO") {
			navigation.dispatch(data.data.action);
			return;
		}
		if (data.data.action.type === "GO_BACK") {
			navigation.dispatch(data.data.action);
			return;
		}
		if (!isDirty) {
			navigation.dispatch(data.data.action);
			return;
		}
		const msg =
			type === "feature"
				? "Are you sure you want to cancel this feedback?"
				: "Are you sure you want to cancel this issue?";
		Alert.alert("Discard Changes", msg, [
			{
				text: "Discard Changes",
				style: "destructive",
				onPress: () => {
					navigation.dispatch(data.data.action);
				},
			},
			{
				text: "Cancel",
				style: "cancel",
			},
		]);
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
					<PageHeader
						type={type}
						isDirty={isDirty}
						submitDisabled={pending || submitDisabled}
						backDisabled={pending}
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

const PageHeader = ({
	isDirty,
	type,
	submitDisabled,
	backDisabled,
	onSubmit,
}: {
	isDirty: boolean;
	type: "feature" | "issue";
	submitDisabled: boolean;
	backDisabled: boolean;
	onSubmit: () => Promise<void>;
}) => {
	const clickRef = useRef(false);
	const router = useRouter();

	const handleBack = useCallback(() => {
		if (clickRef.current) return;
		if (backDisabled) return;
		clickRef.current = true;
		if (!isDirty) {
			if (router.canGoBack()) {
				router.back();
			} else {
				router.dismissTo("/settings");
			}
			return;
		}
		Alert.alert("Discard Changes", "Are you sure you want to leave this page?", [
			{
				text: "Discard Changes",
				style: "destructive",
				onPress: () => {
					if (router.canGoBack()) {
						router.back();
					} else {
						router.dismissTo("/settings");
					}
					setTimeout(() => {
						clickRef.current = false;
					}, 500);
				},
			},
			{
				text: "Cancel",
				style: "cancel",
				onPress: () => {
					clickRef.current = false;
				},
			},
		]);
	}, [router, isDirty, backDisabled]);

	const handleSubmit = useCallback(() => {
		if (clickRef.current) return;
		clickRef.current = true;
		onSubmit();
		setTimeout(() => {
			clickRef.current = false;
		}, 500);
	}, [onSubmit]);

	return (
		<View className="w-full px-4 p-4 items-center flex flex-row gap-x-4">
			<TouchableOpacity
				disabled={backDisabled}
				className="mb-4 disabled:opacity-50"
				activeOpacity={0.8}
				onPress={handleBack}
			>
				<Text className="text-destructive/80 font-medium text-lg" maxFontSizeMultiplier={1.2}>
					{"Cancel"}
				</Text>
			</TouchableOpacity>
			<View className="flex-1 items-center justify-center">
				<Text
					style={{ fontFamily: "Baloo", lineHeight: 32, fontSize: 24 }}
					className="text-foreground font-normal text-2xl"
					maxFontSizeMultiplier={1.2}
				>
					{type === "feature" ? "Provide Feedback" : "Report an Issue"}
				</Text>
			</View>
			<TouchableOpacity onPress={handleSubmit} className="mb-4 disabled:opacity-50" disabled={submitDisabled}>
				<Text className="text-border font-semibold text-lg" maxFontSizeMultiplier={1.2}>
					{"Submit"}
				</Text>
			</TouchableOpacity>
		</View>
	);
};
