import { FaAngleLeft } from "react-icons/fa";
import Button from "../../components/common/Button";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Button
          variant="link"
          className="flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <FaAngleLeft /> Go back
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-600 mb-8">Last updated: May 23, 2025</p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Introduction</h2>
        <p className="mb-4">
          Welcome to our Learning Management System ("LMS"). We respect your privacy and are committed to protecting
          your personal data. This privacy policy will inform you about how we look after your personal data when you
          visit our platform and tell you about your privacy rights and how the law protects you.
        </p>
        <p className="mb-4">
          This privacy policy applies to all users of our LMS platform, including students, instructors,
          administrators, and visitors.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold mb-2">Personal Information</h3>
            <p className="mb-4">
              We collect personal information that you voluntarily provide to us when you register on the LMS, express
              an interest in obtaining information about us or our products and services, or otherwise contact us. The
              personal information we collect may include:
            </p>
            <ul className="list-disc pl-8 mb-4 space-y-2">
              <li>Name, email address, and contact details</li>
              <li>Login credentials (username and password)</li>
              <li>Profile information (such as profile picture, bio, etc.)</li>
              <li>Educational background and learning preferences</li>
              <li>Payment information when purchasing courses</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Usage Data</h3>
            <p className="mb-4">
              We automatically collect certain information when you visit, use or navigate the LMS. This information
              does not reveal your specific identity but may include:
            </p>
            <ul className="list-disc pl-8 mb-4 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Learning activities and progress</li>
              <li>Course completion rates and assessment scores</li>
              <li>Time spent on specific learning materials</li>
              <li>Log data and platform usage statistics</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
        <p className="mb-4">
          We use the information we collect for various purposes, including:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Providing, operating, and maintaining our LMS platform</li>
          <li>Personalizing your learning experience</li>
          <li>Processing transactions and managing your account</li>
          <li>Tracking your progress and generating completion certificates</li>
          <li>Improving our educational content and platform functionality</li>
          <li>Communicating with you about courses, updates, and support</li>
          <li>Analyzing usage patterns to enhance user experience</li>
          <li>Detecting, preventing, and addressing technical or security issues</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Data Sharing and Disclosure</h2>
        <p className="mb-4">We may share your information in the following situations:</p>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold mb-2">Third-Party Service Providers</h3>
            <p className="mb-4">
              We may share your data with third-party vendors, service providers, and other partners who perform
              services for us or on our behalf, such as payment processing, data analysis, email delivery, hosting
              services, and customer service.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Educational Institutions</h3>
            <p className="mb-4">
              If you access our LMS through your educational institution, we may share information about your
              progress, completion status, and assessment results with authorized representatives of that institution.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Legal Requirements</h3>
            <p className="mb-4">
              We may disclose your information where required to do so by law or in response to valid requests by
              public authorities (e.g., a court or a government agency).
            </p>
          </div>
        </div>
      </section>

      <div>
        <hr />
        <p className="text-sm text-gray-400 py-4">By using our LMS, you acknowledge that you have read this Privacy Policy and agree to its terms.</p>
      </div>
    </div>
  );
}