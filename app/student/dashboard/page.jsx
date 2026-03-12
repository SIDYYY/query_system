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
      let attachment_url = null;

      if (formData.attachment) {
        const fileExt = formData.attachment.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(fileName, formData.attachment);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("attachments")
          .getPublicUrl(fileName);

        attachment_url = data.publicUrl;
      }

      const { error } = await supabase.from("requests").insert([
        {
          user_type: userType,

          guest_name: userType === "guest" ? formData.name : null,
          
          gender: formData.gender,

          student_or_faculty_id:
            userType !== "guest" ? formData.id : null,

          contact_no:
            userType !== "guest" ? formData.contact_no : null,

          section:
            userType === "student" ? formData.section : null,

          concern: formData.concern,
          description: formData.description,
          email: formData.email,
          attachment_url: formData.attachment_url,
        },
      ]);

      if (error) throw error;

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
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4 "
      >
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Submit Concern
        </h1>

        {/* USER TYPE */}
        <div className="flex justify-center gap-4 mb-4 ">
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
              name="name"
              value={formData.name}
              onChange={handleChange}
            />

            <div>
              <label className="block mb-1 font-medium text-gray-800">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">
                  Prefer not to say
                </option>
              </select>
            </div>
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
            <div>
              <label className="block mb-1 font-medium text-gray-800">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">
                  Prefer not to say
                </option>
              </select>
            </div>

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

        {/* CONCERN */}
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

        {/* DESCRIPTION */}
        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />

        {/* ATTACHMENT */}
        <FileInput
          label="Attachment (Image)"
          name="attachment"
          onChange={handleChange}
        />

        {/* EMAIL */}
        <Input
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          type="email"
        />

        {/* SUBMIT */}
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

/* INPUT COMPONENT */
function Input({ label, name, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-800">
        {label}
      </label>
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

/* TEXTAREA COMPONENT */
function Textarea({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-800">
        {label}
      </label>
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

/* FILE INPUT COMPONENT */
function FileInput({ label, name, onChange }) {
  return (
    <div>
      <label className="block mb-1 font-medium text-gray-800">
        {label}
      </label>
      <input
        type="file"
        name={name}
        accept="image/*"
        onChange={onChange}
        className="w-full text-gray-700"
      />
    </div>
  );
}