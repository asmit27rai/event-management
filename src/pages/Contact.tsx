import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Instagram } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { account } from "@/appwrite";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  email?: string;
  name?: string;
  $id?: string;
}

const Contact = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = {
      email: user?.email || "",
      Name: `${form.firstName.value} ${form.lastName.value}`.trim(),
      subject: form.subject.value,
      message: form.message.value,
    };

    if (!formData.email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to send email");
      }

      toast({
        title: "Success",
        description: "Email sent successfully!",
      });
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const socialLinks = [
    {
      icon: <Github className="h-6 w-6" />,
      label: "GitHub",
      href: `${import.meta.env.VITE_GITHUB}`,
    },
    {
      icon: <Linkedin className="h-6 w-6" />,
      label: "LinkedIn",
      href: `${import.meta.env.VITE_LINKEDIN}`,
    },
    {
      icon: <Instagram className="h-6 w-6" />,
      label: "Instagram",
      href: `${import.meta.env.VITE_INSTA}`,
    },
  ];

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch (error) {
        console.error("Session check failed:", error);
        navigate("/login");
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">
          Get in Touch
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-4 rounded-lg bg-gray-200 hover:bg-gray-300 transition duration-300 shadow-md hover:shadow-lg text-gray-700"
            >
              {link.icon}
              <span className="font-semibold">{link.label}</span>
            </a>
          ))}
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 p-6 rounded-t-lg">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Send me a message
            </CardTitle>
            <CardDescription className="text-gray-600">
              Fill out the form below and I'll get back to you as soon as
              possible.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-gray-700">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Enter your first name"
                    required
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-gray-700">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Enter your last name"
                    required
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="subject" className="text-gray-700">
                  Subject
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Enter message subject"
                  required
                  className="border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="message" className="text-gray-700">
                  Message
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  required
                  className="min-h-[150px] border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg"
              >
                {isLoading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Contact;
