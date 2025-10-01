import { Text, View } from "react-native";
import { BaseToast, ErrorToast, ToastProps } from "react-native-toast-message";
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

export const toastConfig = {
	proUpgrade: ({ text1, ...props }: ToastProps & { text1?: string }) => <ProUpgradeToast text1={text1} {...props} />,
	success: ({ text1, ...props }: ToastProps & { text1?: string }) => <BaseToast text1={text1} {...props} />,
	error: ({ text1, ...props }: ToastProps & { text1?: string }) => <ErrorToast text1={text1} {...props} />,
};
