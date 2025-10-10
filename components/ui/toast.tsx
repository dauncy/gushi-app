import { Text, View } from "react-native";
import { ToastProps } from "react-native-toast-message";
import { AlertTriangle } from "./icons/alert-triangle";
import { CircleCheck } from "./icons/circle-check";
import { MoonStar } from "./icons/moonstar-icon";

const ProUpgradeToast = ({ text1 }: { text1?: string }) => {
	return (
		<View className="flex-row items-center gap-3 rounded-xl border border-destructive bg-background px-4 py-3 shadow-md w-[92%] self-center">
			<MoonStar size={24} className="text-destructive" />
			<View className="flex-1">
				<Text className="text-destructive font-semibold text-base">
					{text1 ?? "Congrats! You've upgraded to Gushi Pro 🌙"}
				</Text>
			</View>
		</View>
	);
};

const ErrorToast = ({ heading, description, ...props }: ToastProps & { heading: string; description: string }) => {
	return (
		<View
			style={{
				shadowColor: "#000000",
				shadowOffset: { width: 1.5, height: 3.75 },
				shadowOpacity: 0.4,
				shadowRadius: 6,
				elevation: 5,
			}}
			className="flex-row items-start gap-x-2 rounded-xl border-2 border-destructive bg-background px-4 py-3 shadow-md w-[92%] self-center"
			{...props}
		>
			<AlertTriangle size={24} className="text-destructive" />
			<View className="flex-1 flex-col gap-y-0">
				<Text className="text-destructive font-semibold text-base" allowFontScaling={false}>
					{heading}
				</Text>
				<Text className="text-foreground/80 font-medium text-sm" allowFontScaling={false}>
					{description}
				</Text>
			</View>
		</View>
	);
};

const SuccessToast = ({ heading, description, ...props }: ToastProps & { heading: string; description: string }) => {
	return (
		<View
			style={{
				shadowColor: "#000000",
				shadowOffset: { width: 1.5, height: 3.75 },
				shadowOpacity: 0.25,
				shadowRadius: 6,
				elevation: 5,
			}}
			className="flex-row items-start gap-x-2 rounded-xl border-2 border-border bg-background px-4 py-3 shadow-md w-[92%] self-center"
			{...props}
		>
			<CircleCheck size={24} className="text-background fill-border" />
			<View className="flex-1 flex-col gap-y-0">
				<Text className="text-border font-semibold text-base" allowFontScaling={false}>
					{heading}
				</Text>
				<Text className="text-foreground/80 font-medium text-sm" allowFontScaling={false}>
					{description}
				</Text>
			</View>
		</View>
	);
};

export const toastConfig = {
	proUpgrade: ({ text1, ...props }: ToastProps & { text1?: string }) => <ProUpgradeToast text1={text1} {...props} />,
	success: ({ text1, text2, ...props }: ToastProps & { text1?: string; text2?: string }) => (
		<SuccessToast
			heading={text1 ?? "Success"}
			description={text2 ?? "We've successfully performed this request."}
			{...props}
		/>
	),
	error: ({ text1, text2, ...props }: ToastProps & { text1?: string; text2?: string }) => (
		<ErrorToast
			heading={text1 ?? "An unexpected error occurred"}
			description={text2 ?? "We hit a snag trying to perform this request. Please try again later"}
			{...props}
		/>
	),
};
