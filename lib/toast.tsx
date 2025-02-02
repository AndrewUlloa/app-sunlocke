import { toast as sonnerToast } from "sonner"
import { type ReactNode } from "react"
import { CustomToast } from "@/components/ui/custom-toast"

interface CustomToastOptions {
  message: string
  description?: string
  icon?: ReactNode
  id?: string | number
}

export const toast = {
  custom: (options: CustomToastOptions & { variant?: 'default' | 'success' | 'error' }) => {
    return sonnerToast.custom(() => <CustomToast {...options} />, {
      id: options.id,
    })
  },
  success: (options: CustomToastOptions) => {
    return toast.custom({ 
      ...options, 
      variant: 'success',
      icon: <svg className="w-4 h-4" preserveAspectRatio="xMidYMid meet" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_1382_5097)">
          <path d="M5.66602 10.3334L7.66602 12.3334L12.3327 7.66671" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.00065 16.6667C12.6825 16.6667 15.6673 13.6819 15.6673 10C15.6673 6.31814 12.6825 3.33337 9.00065 3.33337C5.31875 3.33337 2.33398 6.31814 2.33398 10C2.33398 13.6819 5.31875 16.6667 9.00065 16.6667Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <defs>
          <filter id="filter0_d_1382_5097" x="0" y="0" width="22" height="22" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dx="2" dy="1"/>
            <feGaussianBlur stdDeviation="1.5"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.7 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1382_5097"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1382_5097" result="shape"/>
          </filter>
        </defs>
      </svg>
    })
  },
  error: (options: CustomToastOptions) => {
    return toast.custom({ 
      ...options, 
      variant: 'error',
      icon: <svg className="w-4 h-4" preserveAspectRatio="xMidYMid meet" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_1382_5098)">
          <path d="M9 10V6.66669" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9 13.3333L9.00667 13.3259" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.00065 16.6667C12.6825 16.6667 15.6673 13.6819 15.6673 10C15.6673 6.31814 12.6825 3.33337 9.00065 3.33337C5.31875 3.33337 2.33398 6.31814 2.33398 10C2.33398 13.6819 5.31875 16.6667 9.00065 16.6667Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <defs>
          <filter id="filter0_d_1382_5098" x="0" y="0" width="22" height="22" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dx="2" dy="1"/>
            <feGaussianBlur stdDeviation="1.5"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.7 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1382_5098"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1382_5098" result="shape"/>
          </filter>
        </defs>
      </svg>
    })
  },
  loading: (options: CustomToastOptions) => {
    return toast.custom({ ...options, icon: "loading" })
  }
} 
