import { useState, useEffect } from "react"

const useMediaQuery = (query: string): boolean => {
  // Initialize to undefined to avoid hydration mismatch
  const [matches, setMatches] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    // Set the initial value once we're on the client
    const media = window.matchMedia(query)
    setMatches(media.matches)

    // Add listener for subsequent changes
    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [query]) // Remove matches from dependencies to avoid unnecessary re-runs

  // Return false during SSR and initial render
  return matches ?? false
}

export { useMediaQuery }

