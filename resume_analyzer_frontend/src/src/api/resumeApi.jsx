export const uploadResume = async (file) => {
    try {
        const formData = new FormData();
        formData.append("resume_file", file); // Ensure the key matches Django's expectation

        const response = await fetch("http://127.0.0.1:8000/api/upload/", {
            method: "POST",
            body: formData,
            headers: {
                // Do NOT set 'Content-Type' manually; the browser sets it automatically for FormData
            },
        });

        const data = await response.json();
        console.log("Server Response:", data);

        if (!response.ok) {
            throw new Error(data.error || "Upload failed");
        }

        return data;
    } catch (error) {
        console.error("Upload error:", error);
        throw error;
    }
};
