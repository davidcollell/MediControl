/**
 * Servei per gestionar el retrocés hàptic (vibració) de l'aplicació.
 */
export const Haptics = {
  /**
   * Vibració curta per a interaccions tipus "click" o "tick".
   */
  tick: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * Patró de vibració d'èxit (doble polsació ràpida).
   * Ideal per a quan es marca una pastilla com a presa.
   */
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  },

  /**
   * Vibració d'advertència o error (polsació més llarga).
   */
  warning: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200);
    }
  }
};
