import { Brand } from '@/types/brand'
import { MoreVertical, User } from 'lucide-react'

interface NavbarProps {
  brand?: Partial<Brand> & { icon?: string; initials?: string };
}

export default function Navbar({ brand }: NavbarProps) {
    return(
        <>
            <nav className='w-full pt-3 pb-3 bg-gray-300 flex items-center justify-between px-4'>
                <div className='brand-icon'>{brand?.icon || brand?.initials || "LOGO"}</div>
                <div className='flex items-center gap-3'>
                    <div className='rounded-[50%] p-2 bg-white/50'>
                        <User size={20} />
                    </div>
                    <MoreVertical size={20} className="cursor-pointer" />
                </div>
            </nav>
        </>
    )
}