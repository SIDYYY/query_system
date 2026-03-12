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
    id: "",
    contact_no: "",
    section: "",
    concern: CONCERNS[0],
    description: "",
    email: "",
    attachment: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment" && files) {
      setFormData({ ...formData, attachment: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let attachmentUrl = null;

      if (formData.attachment) {
        const fileExt = formData.attachment.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(fileName, formData.attachment);
        if (uploadError) throw uploadError;

        const { publicURL, error: urlError } = supabase
          .storage
          .from("attachments")
          .getPublicUrl(fileName);
        if (urlError) throw urlError;
        attachmentUrl = publicURL;
      }

      const { error } = await supabase.from("requests").insert([
        {
          user_type: userType,
          student_or_faculty_id: formData.id,
          contact_no: formData.contact_no,
          section: userType === "student" ? formData.section : null,
          concern: formData.concern,
          description: formData.description,
          email: formData.email,
          attachment_url: attachmentUrl,
        },
      ]);
      if (error) throw error;

      alert("Request submitted successfully!");
      setFormData({
        id: "",
        contact_no: "",
        section: "",
        concern: CONCERNS[0],
        description: "",
        email: "",
        attachment: null,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to submit request.");
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

        {/* User Type */}
        <div className="flex justify-center gap-4 mb-4">
          {["student", "faculty", "guests"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setUserType(type)}
              className={`px-4 py-2 rounded-full font-semibold ${
                userType === type ? "bg-blue-600 text-white shadow" : "bg-gray-200 text-gray-700"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* ID & Contact Number */}
        <Input
          label={userType === "student" ? "Student ID" : "Faculty ID"}
          name="id"
          value={formData.id}
          onChange={handleChange}
        />
        <Input
          label="Contact Number"
          name="contact_no"
          value={formData.contact_no}
          onChange={handleChange}
          type="tel"
        />

        {/* Section */}
        {userType === "student" && (
          <Input label="Section" name="section" value={formData.section} onChange={handleChange} />
        )}

        {/* Concern Dropdown */}
        <div>
          <label className="block mb-1 font-medium text-gray-800">Concern</label>
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

        {/* Additional Description */}
        <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} />

        {/* Attachment & Email */}
        <FileInput label="Attachment (Image)" name="attachment" onChange={handleChange} />
        <Input label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />

        {/* Submit Button */}
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

// Reusable components
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

function Textarea({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-800">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
      />
    </div>
  );
}

function FileInput({ label, name, onChange }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-800">{label}</label>
      <input type="file" name={name} accept="image/*" onChange={onChange} className="w-full text-gray-700" />
    </div>
  );
}