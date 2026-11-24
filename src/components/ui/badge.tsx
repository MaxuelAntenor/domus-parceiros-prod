import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // NOVO: variantes com cor fixa (não dependem de variável de tema),
        // pra status semânticos (atrasado/vencido = vermelho, pago/concluído
        // = verde) que precisam de contraste garantido nos dois temas.
        // Usa "!important" (prefixo "!") porque existe uma regra global do
        // projeto (.rounded-full.border) com especificidade CSS maior que
        // uma classe utilitária simples, que sobrescrevia o fundo de
        // qualquer badge (rounded-full + border fazem parte da base de
        // todo Badge) para quase-transparente -- some com texto branco.
        danger: "!border-transparent !bg-red-600 !text-white hover:!bg-red-600",
        "success-solid": "!border-transparent !bg-green-600 !text-white hover:!bg-green-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
