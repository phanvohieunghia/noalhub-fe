import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "use-intl";
import { z } from "zod";

import { registerSchema, useRegister } from "@noalhub/api/auth";
import { ApiError, ERROR_CODES } from "@noalhub/api/errors";
import { useMessage } from "../../lib/i18n";
import { Icon } from "@noalhub/ui-native";

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const tAuth = useTranslations("web.auth");
  const tCommon = useTranslations("common");
  const m = useMessage();

  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: registerUser, isPending } = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    setFormError(null);
    registerUser(data, {
      onSuccess: () => {
        router.replace("/");
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          if (err.code === ERROR_CODES.emailTaken || err.status === 409) {
            setFormError("common.errors.emailTaken");
            return;
          }
          if (err.code === ERROR_CODES.rateLimited) {
            setFormError("common.errors.tooFast");
            return;
          }
        }
        setFormError(
          err instanceof Error
            ? err.message
            : "common.errors.unknown",
        );
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="self-start mb-6 flex-row items-center gap-1.5 py-2 pr-4"
          >
            <Icon name="arrowLeft" size={16} className="text-accent" />
            <Text className="text-sm font-medium text-accent">{tCommon("actions.back")}</Text>
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground">
              {tAuth("register.title")}
            </Text>
            <Text className="text-base text-muted-foreground mt-1.5">
              {tAuth("register.subtitle")}
            </Text>
          </View>

          {/* Form Error Banner */}
          {formError && (
            <View className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4">
              <Text className="text-sm text-danger font-medium">{m(formError)}</Text>
            </View>
          )}

          {/* Inputs */}
          <View className="gap-5">
            {/* Display Name Field */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-1.5">
                {tAuth("register.displayName")}
              </Text>
              <Controller
                control={control}
                name="displayName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-foreground"
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor="#95a1a2"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.displayName && (
                <Text className="text-xs text-danger mt-1">
                  {m(errors.displayName.message)}
                </Text>
              )}
            </View>

            {/* Email Field */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-1.5">
                {tAuth("register.email")}
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-foreground"
                    placeholder="name@example.com"
                    placeholderTextColor="#95a1a2"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.email && (
                <Text className="text-xs text-danger mt-1">
                  {m(errors.email.message)}
                </Text>
              )}
            </View>

            {/* Password Field */}
            <View>
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-sm font-medium text-foreground">
                  {tAuth("register.password")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-xs text-accent">
                    {showPassword
                      ? tCommon("actions.hide")
                      : tCommon("actions.show")}
                  </Text>
                </TouchableOpacity>
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-foreground"
                    placeholder="••••••••••••"
                    placeholderTextColor="#95a1a2"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.password && (
                <Text className="text-xs text-danger mt-1">
                  {m(errors.password.message)}
                </Text>
              )}
            </View>

            {/* Confirm Password Field */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-1.5">
                {tAuth("register.confirmPassword")}
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-foreground"
                    placeholder="••••••••••••"
                    placeholderTextColor="#95a1a2"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.confirmPassword && (
                <Text className="text-xs text-danger mt-1">
                  {m(errors.confirmPassword.message)}
                </Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`h-12 rounded-xl bg-primary items-center justify-center mt-2 active:opacity-85 ${
                isPending ? "opacity-70" : ""
              }`}
              onPress={() => void handleSubmit(onSubmit)()}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-primary-foreground">
                  {tAuth("register.submit")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer: Login link */}
          <View className="flex-row justify-center items-center mt-8 gap-1.5">
            <Text className="text-sm text-muted-foreground">
              {tAuth("register.hasAccount")}
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text className="text-sm font-semibold text-accent">
                {tAuth("register.login")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
