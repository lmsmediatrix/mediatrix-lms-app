import { FaAngleLeft } from "react-icons/fa";
import Button from "../../components/common/Button";
import { useNavigate } from "react-router-dom";

export default function TermsAndCondition() {
    const navigate = useNavigate()
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

      <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
      <p className="text-gray-600 mb-8">Last updated: 5/23/2025</p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
        <p className="mb-4">
          Welcome to our Learning Management System ("LMS"). By accessing or
          using our platform, you agree to be bound by these Terms and
          Conditions ("Terms"). Please read these Terms carefully before using
          our services.
        </p>
        <p className="mb-4">
          These Terms constitute a legally binding agreement between you and
          [Your Company Name] regarding your use of the LMS platform and any
          related services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          2. User Accounts and Registration
        </h2>
        <p className="mb-4">
          To access certain features of our LMS, you may be required to register
          for an account. You agree to provide accurate, current, and complete
          information during the registration process and to update such
          information to keep it accurate, current, and complete.
        </p>
        <p className="mb-4">
          You are responsible for safeguarding your password and for all
          activities that occur under your account. You agree to notify us
          immediately of any unauthorized use of your account.
        </p>
        <p className="mb-4">
          We reserve the right to disable any user account at any time if, in
          our opinion, you have failed to comply with any of the provisions of
          these Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          3. Content and Intellectual Property
        </h2>
        <p className="mb-4">
          Our LMS contains content owned or licensed by us, including but not
          limited to text, graphics, logos, icons, images, audio clips, digital
          downloads, data compilations, and software. This content is protected
          by copyright, trademark, and other intellectual property laws.
        </p>
        <p className="mb-4">
          We grant you a limited, non-exclusive, non-transferable, and revocable
          license to access and use our LMS content for personal, non-commercial
          purposes. You may not reproduce, distribute, modify, create derivative
          works of, publicly display, publicly perform, republish, download,
          store, or transmit any content on our LMS without our express written
          permission.
        </p>
        <p className="mb-4">
          Any content you submit, post, or display on our LMS is subject to our
          Privacy Policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          4. User Conduct and Prohibited Activities
        </h2>
        <p className="mb-4">You agree not to use our LMS:</p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>
            In any way that violates any applicable federal, state, local, or
            international law or regulation.
          </li>
          <li>
            To transmit, or procure the sending of, any advertising or
            promotional material, including any "junk mail," "chain letter,"
            "spam," or any other similar solicitation.
          </li>
          <li>
            To impersonate or attempt to impersonate our company, an employee,
            another user, or any other person or entity.
          </li>
          <li>
            To engage in any other conduct that restricts or inhibits anyone's
            use or enjoyment of our LMS, or which may harm us or users of our
            LMS.
          </li>
          <li>
            To attempt to gain unauthorized access to, interfere with, damage,
            or disrupt any parts of our LMS, the server on which our LMS is
            stored, or any server, computer, or database connected to our LMS.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">5. Payment Terms</h2>
        <p className="mb-4">
          Some features of our LMS may require payment. By subscribing to a paid
          plan, you agree to pay all fees in accordance with the pricing and
          payment terms presented to you.
        </p>
        <p className="mb-4">
          All payments are non-refundable unless otherwise specified. We reserve
          the right to change our prices at any time, and such changes will be
          posted on our LMS and will apply to billing cycles after the notice of
          change.
        </p>
        <p className="mb-4">
          If you dispute any charges, you must notify us within 30 days of the
          date of the charge.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">6. Privacy Policy</h2>
        <p className="mb-4">
          Your use of our LMS is also governed by our Privacy Policy, which is
          incorporated into these Terms by reference. Please review our Privacy
          Policy to understand our practices regarding your personal
          information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
        <p className="mb-4">
          In no event will we, our affiliates, or our licensors, service
          providers, employees, agents, officers, or directors be liable for
          damages of any kind, under any legal theory, arising out of or in
          connection with your use, or inability to use, our LMS, including any
          direct, indirect, special, incidental, consequential, or punitive
          damages.
        </p>
        <p className="mb-4">
          Some jurisdictions do not allow the exclusion of certain warranties or
          the limitation or exclusion of liability for certain types of damages.
          Therefore, some of the above limitations may not apply to you.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">8. Termination</h2>
        <p className="mb-4">
          We may terminate or suspend your account and access to our LMS
          immediately, without prior notice or liability, for any reason,
          including if you breach these Terms.
        </p>
        <p className="mb-4">
          Upon termination, your right to use our LMS will immediately cease.
          All provisions of these Terms which by their nature should survive
          termination shall survive termination, including, without limitation,
          ownership provisions, warranty disclaimers, indemnity, and limitations
          of liability.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">9. Changes to Terms</h2>
        <p className="mb-4">
          We reserve the right to modify these Terms at any time. If we make
          changes to these Terms, we will post the revised Terms on our LMS and
          update the "Last Updated" date at the top of these Terms.
        </p>
        <p className="mb-4">
          Your continued use of our LMS following the posting of revised Terms
          means that you accept and agree to the changes. You are expected to
          check this page frequently so you are aware of any changes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
        <p className="mb-4">
          These Terms and your use of our LMS will be governed by and construed
          in accordance with the laws of [Your Jurisdiction], without giving
          effect to any choice or conflict of law provision or rule.
        </p>
      </section>

      {/* <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">11. Contact Information</h2>
        <p className="mb-4">
          If you have any questions about these Terms, please contact us at:
        </p>
        <div className="mb-4">
          <p>[Your Company Name]</p>
          <p>[Your Address]</p>
          <p>Email: support@yourlmsapp.com</p>
          <p>Phone: [Your Phone Number]</p>
        </div>
        <p className="mb-4 font-medium">
          By using our LMS, you acknowledge that you have read these Terms and
          agree to be bound by them.
        </p>
      </section> */}
      <div>
        <hr />  
        <p className="text-sm text-gray-400 py-4">By using our LMS, you acknowledge that you have read these Terms and agree to be bound by them.</p>
      </div>
    </div>
  );
}
