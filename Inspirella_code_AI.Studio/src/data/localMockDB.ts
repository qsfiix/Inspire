export const LocalMockDB = {
  getProfile(): any {
    const data = localStorage.getItem("inspirella_profile");
    return data ? JSON.parse(data) : null;
  },
  saveProfile(profile: any) {
    localStorage.setItem("inspirella_profile", JSON.stringify(profile));
  },
  getTrackers(): any[] {
    const data = localStorage.getItem("inspirella_trackers");
    return data ? JSON.parse(data) : [];
  },
  saveTrackers(trackers: any[]) {
    localStorage.setItem("inspirella_trackers", JSON.stringify(trackers));
  },
  clearAll() {
    localStorage.removeItem("inspirella_profile");
    localStorage.removeItem("inspirella_trackers");
  }
};
