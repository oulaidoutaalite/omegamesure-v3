import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // `rounded-sm` suit `--radius` : des angles francs, comme le reste du theme.
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // ⚠️ Le bouton par defaut porte la couleur d'ACTION du theme — `cta`,
        // aujourd'hui rouge brique. L'en-tete affichait jadis un « Demander un
        // devis » d'une couleur quand la fiche produit en montrait une autre :
        // deux appels a l'action de meme nature, de deux couleurs. Un seul
        // defaut evite que cela recommence.
        //
        // `brand` (marine) ne sert plus nulle part dans le site public : il n'y
        // reste aucun aplat marine. La variante est conservee pour
        // l'administration, qui garde cette palette.
        default:     'bg-cta text-white hover:bg-cta-600 shadow-sm',
        brand:       'bg-brand text-white hover:bg-brand-700 shadow-sm',
        secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:     'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
        ghost:       'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link:        'text-cta underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm:      'h-8  px-3 text-xs',
        lg:      'h-12 px-7 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
