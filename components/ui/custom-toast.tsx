import { Loader2 } from "lucide-react"
import { type ExternalToast } from "sonner"
import { cn } from "@/lib/utils"

interface CustomToastProps extends Omit<ExternalToast, 'message'> {
  message: string
  description?: string
  variant?: 'default' | 'success' | 'error'
}

export function CustomToast({ description, variant = 'default', ...props }: CustomToastProps) {
  const isLoading = props.icon === "loading"

  return (
    <div
      className={cn(
        "relative rounded overflow-hidden max-h-[300px] min-w-[284px] z-[1] shadow-[0px_0px_3px_rgba(255,255,255,0.5),0px_0px_3px_rgba(255,255,255,0.5),0px_0px_2.25px_rgba(255,255,255,0.7),0px_0px_4.5px_rgba(255,255,255,0.9)]",
        {
          "bg-[linear-gradient(180deg,_#4D73C5_0%,_#1F4CAD_14%,_#2150B6_28%,_#7A96D3_72%,_#e0e5ff_100%)] shadow-[0px_0px_3px_rgba(255,255,255,0.5),0px_0px_3px_rgba(255,255,255,0.5),0px_0px_2.25px_rgba(255,255,255,0.7),0px_0px_4.5px_rgba(255,255,255,0.9),0px_0px_4.5px_#4D73C5,0px_0px_3.75px_#4D73C5,0px_0px_4.125px_#1E48A4]":
            variant === 'default',
          "bg-[linear-gradient(180deg,_#549E64_0%,_#437A4F_11.36%,_#3F764B_23.99%,_#69C57D_60.6%,_#E0FFE6_84.17%)] shadow-[0px_0px_3px_rgba(255,255,255,0.5),0px_0px_3px_rgba(255,255,255,0.5),0px_0px_2.25px_rgba(255,255,255,0.7),0px_0px_4.5px_rgba(255,255,255,0.9),0px_0px_4.5px_#549E64,0px_0px_3.75px_#437A4F,0px_0px_4.125px_#3F764B]":
            variant === 'success',
          "bg-[linear-gradient(180deg,_#FFE2E0_0%,_#E77C72_23.4%,_#DC4435_39.4%,_#CF493C_72.64%,_#E05749_100%)] shadow-[0px_0px_3px_rgba(255,255,255,0.5),0px_0px_3px_rgba(255,255,255,0.5),0px_0px_2.25px_rgba(255,255,255,0.7),0px_0px_4.5px_rgba(255,255,255,0.9),0px_0px_4.5px_#E05749,0px_0px_3.75px_#DC4435,0px_0px_4.125px_#B0362A]":
            variant === 'error'
        }
      )}
    >
      {/* Simulated bottom outline (pseudo-element) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[11px] rounded z-[2] pointer-events-none blur-[1px]"
        style={{ background: "linear-gradient(0deg, #000000 0%, #9a9a9a 100%)" }}
      ></div>

      {/* White border inner stroke */}
      <div className="absolute inset-0 rounded border-[8px] border-white z-[3]"></div>

      {/* Black quarter border inner stroke with negative inset */}
      <div
        className="absolute -inset-[8px] flex items-center justify-center rounded border-[4px] z-[4]"
        style={{ borderColor: "#00000025" }}
      ></div>

      {/* Linear half border inner stroke with gradient */}
      <div
        className="absolute -inset-[4px] rounded border-[8px] z-[5]"
        style={{
          borderStyle: "solid",
          borderImage:
            "linear-gradient(270deg, #ffffff80 0%, #ffffff80 50%, #d0d0d080 95%, #aeaeae80 100%) 1",
        }}
      ></div>

      {/* Top glass inner border (stroke + outline) */}
      <div className="relative z-[6]">
        <div
          className="relative p-[3px] rounded backdrop-blur-[4px]
                 bg-[rgba(139,139,139,0.3)] border border-solid border-[0.8px] border-[#717f96]"
        >
          {/* Outline overlay (simulating the ::after pseudo-element) */}
          <div
            className="absolute inset-0 rounded pointer-events-none"
            style={{ border: "0.5px solid #ffffff80" }}
          ></div>
          {/* Inner content container */}
          <div className="relative z-10">
            {/* Top ellipses container */}
            <div className="flex items-center justify-between gap-[4px]">
              <div
                className="w-[4px] h-[4px] rounded-full"
                style={{
                  background:
                    "linear-gradient(#c4c4c4 0 0) padding-box, linear-gradient(120deg, #ffffff 0%, #999999 100%) border-box",
                  border: "0.2px solid transparent",
                  boxShadow: "0px 0px 1px 0px hsla(0,0%,0%,0.4)",
                }}
              ></div>
              <div
                className="w-[4px] h-[4px] rounded-full"
                style={{
                  background:
                    "linear-gradient(#c4c4c4 0 0) padding-box, linear-gradient(120deg, #ffffff 0%, #999999 100%) border-box",
                  border: "0.2px solid transparent",
                  boxShadow: "0px 0px 1px 0px hsla(0,0%,0%,0.4)",
                }}
              ></div>
            </div>

            {/* Information container outer */}
            <div className="flex flex-col pt-[8px] pb-[24px] px-[20px]">
              {/* Information container inner: text frame and info button */}
              <div className="flex flex-row items-center justify-start gap-[10px] min-w-[31ch]">
                {/* Icon button */}
                <div
                  className="flex items-center justify-center bg-transparent border-0 cursor-default antialiased"
                  aria-label="Toast status"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    props.icon
                  )}
                </div>
                {/* Text frame */}
                <div className="flex flex-col gap-[8px]">
                  <p
                    className="text-[13px] font-eudoxusSansBold text-[#fbfffc] cursor-default select-none"
                    style={{
                      textShadow: "2px 1px 3px #00000050",
                      ...(variant !== 'error' && {
                        WebkitUserSelect: "none",
                        userSelect: "none",
                      }),
                    }}
                  >
                    {props.message}
                  </p>
                  {description && (
                    <p
                      className="text-[13px] font-eudoxusSansMedium text-[#fbfffc] leading-[1.25] cursor-default select-none"
                      style={{
                        textShadow: "2px 1px 3px #00000070",
                        ...(variant !== 'error' && {
                          WebkitUserSelect: "none",
                          userSelect: "none",
                        }),
                      }}
                    >
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom ellipses container */}
            <div className="flex items-center justify-between gap-[4px]">
              <div
                className="w-[4px] h-[4px] rounded-full"
                style={{
                  background:
                    "linear-gradient(#c4c4c4 0 0) padding-box, linear-gradient(120deg, #ffffff 0%, #999999 100%) border-box",
                  border: "0.2px solid transparent",
                  boxShadow: "0px 0px 1px 0px hsla(0,0%,0%,0.4)",
                }}
              ></div>
              <div
                className="w-[4px] h-[4px] rounded-full"
                style={{
                  background:
                    "linear-gradient(#c4c4c4 0 0) padding-box, linear-gradient(120deg, #ffffff 0%, #999999 100%) border-box",
                  border: "0.2px solid transparent",
                  boxShadow: "0px 0px 1px 0px hsla(0,0%,0%,0.4)",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
