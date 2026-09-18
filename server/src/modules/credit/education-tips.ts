export interface CreditTip {
  id: string;
  title: string;
  detail: string;
}

export const creditEducationTips: CreditTip[] = [
  {
    id: "utilization",
    title: "Keep utilization under 30% - ideally under 10%",
    detail:
      "Utilization is how much of your credit limit you're using. Lenders like to see you use well under a third of it, even if you pay in full every month.",
  },
  {
    id: "pay-on-time",
    title: "Always pay at least the statement balance, on time, every time",
    detail:
      "Payment history is the single biggest factor in your credit score. One missed payment can hurt your score for years - set up autopay for at least the minimum so you never miss a due date.",
  },
  {
    id: "pay-in-full",
    title: "Pay the full statement balance when you can",
    detail:
      "Carrying a balance doesn't help your score and just costs you interest. Paying in full each month avoids interest entirely while still building a positive payment history.",
  },
  {
    id: "keep-old-cards",
    title: "Don't close your oldest card",
    detail:
      "Average credit age matters. Keeping your first card open (even unused, or with one small recurring charge) helps your credit history look longer and more established.",
  },
  {
    id: "space-out-applications",
    title: "Space out new card applications",
    detail:
      "Each new application creates a hard inquiry and temporarily lowers your average account age. Applying for several cards in a short window can ding your score - space them out by at least several months.",
  },
  {
    id: "credit-mix",
    title: "A healthy mix of account types helps, but don't force it",
    detail:
      "Having both revolving credit (cards) and, later, installment credit (like a car loan or student loan) can help your mix. It's a minor factor - never take on debt you don't need just to diversify.",
  },
  {
    id: "student-specific",
    title: "As a student: start small and build steadily",
    detail:
      "A student or secured card with a modest limit is a great way to start. Use it for a small recurring expense (like a subscription), pay it off in full monthly, and let time and consistency build your history.",
  },
];
