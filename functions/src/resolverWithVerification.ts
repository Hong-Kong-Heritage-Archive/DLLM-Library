import { resolvers } from "./resolver";
import { EmailVerificationService } from "./emailVerificationService";

const emailVerificationService = new EmailVerificationService();
const mutationResolvers = (resolvers as any).Mutation as Record<
  string,
  (...args: any[]) => any
>;

// Starting or progressing a real exchange requires a verified email. Read-only
// browsing/profile actions remain available to authenticated unverified users.
const verificationRequiredMutations = [
  "contactHolder",
  "createQuickTransaction",
  "receiveTransaction",
  "confirmReturn",
  "transferOwnership",
];

for (const mutationName of verificationRequiredMutations) {
  const originalResolver = mutationResolvers?.[mutationName];
  if (typeof originalResolver !== "function") continue;

  mutationResolvers[mutationName] = async (
    parent: any,
    args: any,
    context: { loginUser: any },
    info: any,
  ) => {
    await emailVerificationService.assertVerified(context.loginUser);
    return originalResolver(parent, args, context, info);
  };
}

export { resolvers };
