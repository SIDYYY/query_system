"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const CONCERNS = [
  "Clearance",
  "Certificate",
  "OJT Related Concerns",
  "Applications",
  "Graduation Matters",
  "Consultation",
  "Complains",
  "Others",
];

export default function Home() {
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({
    guest_name: "",
    gender: "",
    id: "",
    contact_no: "",
    section: "",
    concern: CONCERNS[0],
    description: "",
    email: "",
  });

  const [attachments, setAttachments] = useState([]); // array of files/photos
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle camera photo
  const handleCamera = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachments([...attachments, e.target.files[0]]);
    }
  };

  // Handle gallery selection (multiple files)
  const handleGallery = (e) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const attachmentUrls = [];

    for (const file of attachments) {
      if (!file) continue;

      const fileExt = file.name ? file.name.split(".").pop() : "jpg";
      const timestamp = Date.now();
      const safeName = file.name ? file.name.replace(/\s/g, "_") : "photo.jpg";

      const fileName = `attachments/${timestamp}-${safeName}`;

      // Upload to Supabase
      const { data, error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false, // if file exists, fail
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: publicData } = supabase.storage
        .from("attachments")
        .getPublicUrl(fileName);

      attachmentUrls.push(publicData.publicUrl);
    }

    // Insert into database
    const { error } = await supabase.from("requests").insert([
      {
        user_type: userType,
        guest_name: userType === "guest" ? formData.guest_name : null,
        gender: formData.gender,
        student_or_faculty_id: userType !== "guest" ? formData.id : null,
        contact_no: userType !== "guest" ? formData.contact_no : null,
        section: userType === "student" ? formData.section : null,
        concern: formData.concern,
        description: formData.description,
        email: formData.email,
        attachment_url: attachmentUrls, // if your column is json, store array
      },
    ]);

    if (error) {
      console.error("DB insert error:", error);
      throw error;
    }

    alert("Request submitted successfully!");
    setFormData({
      guest_name: "",
      gender: "",
      id: "",
      contact_no: "",
      section: "",
      concern: CONCERNS[0],
      description: "",
      email: "",
    });
    setAttachments([]);
  } catch (error) {
    console.error("Submit failed:", error);
    alert("Failed to submit request. Check console for details.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center font-sans bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Submit Concern
        </h1>

        {/* USER TYPE */}
        <div className="flex justify-center gap-4 mb-4">
          {["student", "faculty", "guest"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setUserType(type)}
              className={`px-4 py-2 rounded-full font-semibold cursor-pointer ${
                userType === type
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* GUEST FIELDS */}
        {userType === "guest" && (
          <>
            <Input
              label="Name"
              name="guest_name"
              value={formData.guest_name}
              onChange={handleChange}
            />
            <SelectGender value={formData.gender} onChange={handleChange} />
          </>
        )}

        {/* STUDENT / FACULTY FIELDS */}
        {userType !== "guest" && (
          <>
            <Input
              label={userType === "student" ? "Student ID" : "Faculty ID"}
              name="id"
              value={formData.id}
              onChange={handleChange}
            />
            <SelectGender value={formData.gender} onChange={handleChange} />
            <Input
              label="Contact Number"
              name="contact_no"
              value={formData.contact_no}
              onChange={handleChange}
              type="tel"
            />
            {userType === "student" && (
              <Input
                label="Section"
                name="section"
                value={formData.section}
                onChange={handleChange}
              />
            )}
          </>
        )}

        {/* Concern */}
        <div>
          <label className="block mb-1 font-medium text-gray-800">
            Concern
          </label>
          <select
            name="concern"
            value={formData.concern}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {CONCERNS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />

        {/* Camera Input */}
        <div>
          <label className="block mb-1 font-medium text-gray-800">
            Take Photo (Camera)
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCamera}
            className="w-full text-gray-700"
          />
        </div>

        {/* Gallery Input */}
        <div>
          <label className="block mb-1 font-medium text-gray-800">
            Add from Gallery
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGallery}
            className="w-full text-gray-700"
          />
        </div>

        {/* Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {attachments.map((file, index) => (
              <img
                key={index}
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-20 h-20 object-cover rounded"
              />
            ))}
          </div>
        )}

        <Input
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          type="email"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

/* Input Component */
function Input({ label, name, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-800">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
      />
    </div>
  );
}

/* Textarea */
function Textarea({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-800">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
      />
    </div>
  );
}

/* Gender Select */
function SelectGender({ value, onChange }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-800">Gender</label>
      <select
        name="gender"
        value={value}
        onChange={onChange}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Prefer not to say">Prefer not to say</option>
      </select>
    </div>
  );
}