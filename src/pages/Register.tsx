import {
  Title,
  Text,
  TextInput,
  Button,
  Container,
  Group,
  Anchor,
  Center,
  Box,
  rem,
  PasswordInput,
  FileInput,
  Avatar,
  Tooltip,
  Modal,
} from '@mantine/core';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import classes from './Register.module.css';
import { IconArrowLeft } from '@tabler/icons-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { query } = router;
  const [name, setName] = useState(query.name || '');
  const [email, setEmail] = useState(query.email || '');
  const [emailExists, setEmailExists] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [organization, setOrganization] = useState(query.organization || '');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(
    typeof query.profilePicturePreview === 'string' ? query.profilePicturePreview : null
  );
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  const handleLogin = () => {
    router.push('/');
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('https://node-iota-livid.vercel.app/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error('Failed to check email existence');
      }
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return 'Invalid email format';
    }
    return null;
  };

  const handleEmailChange = async (value: string) => {
    setEmail(value);
    const error = validateEmail(value);
    if (error) {
      setEmailError(error);
      setEmailExists(false);
      return;
    }

    setEmailError(null);
    const exists = await checkEmailExists(value);
    setEmailExists(exists);
  };

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!?@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError(
        'Password must be at least 8 characters long and include a number, an uppercase letter, and a symbol.'
      );
    } else {
      setPasswordError(null);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePassword(value);
  };

  const compressImage = (file: File, quality: number): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (ctx) {
            const maxWidth = 800;
            const maxHeight = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: file.type }));
              } else {
                resolve(file);
              }
            }, file.type, quality);
          }
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProfilePictureChange = async (file: File | null) => {
    if (file) {
      const compressedFile = await compressImage(file, 0.8);
      setProfilePicture(compressedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicturePreview(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(compressedFile);
    } else {
      setProfilePicturePreview(null);
    }
  };

  interface CroppedArea {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  interface CroppedAreaPixels {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  const handleCropComplete = (croppedArea: CroppedArea, croppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropImage = async () => {
    if (profilePicture && croppedAreaPixels) {
      const reader = new FileReader();
      reader.onload = async () => {
        const croppedImage = await getCroppedImg(reader.result as string, croppedAreaPixels);
        setProfilePicture(croppedImage);
        const reader2 = new FileReader();
        reader2.onload = () => {
          setProfilePicturePreview(reader2.result as string);
          setCropModalOpen(false);
        };
        reader2.readAsDataURL(croppedImage);
      };
      reader.readAsDataURL(profilePicture);
    }
  };

  const handleProceed = () => {
    if (!name || !email || !organization || (password && password !== confirmPassword)) {
      alert('Please fill all fields and ensure the passwords match.');
      return;
    }
    if (emailExists) {
      alert('This email is already in use. Please choose a different email.');
      return;
    }

    router.push({
      pathname: '/Proceed',
      query: {
        name,
        email,
        password,
        organization,
        profilePicture: profilePicture ? profilePicture.name : null,
        profilePicturePreview,
      },
    });
  };

  return (
    <div className={classes.container}>
      <Container size={460} my={30} className={classes.formContainer}>
        <Title className={classes.title} ta="center" style={{ textShadow: '1px 1px 10px rgba(0, 0, 0, 0.6)' }}>
          {query ? 'Update your Profile' : 'Create your Account'}
        </Title>
        <Text c="white" fz="sm" ta="center" style={{ textShadow: '1px 1px 10px rgba(0, 0, 0, 0.6)' }}>
          Enter your information.
        </Text>

        <div className={classes.formContent}>
          <Text c="white" fz="sm" ta="center" style={{ marginBottom: '0.5rem' }}>
            Customize Profile Picture (optional)
          </Text>
          <Center>
            <Tooltip label="Input Profile Picture" withArrow position="top">
              <div
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Avatar
                  size={120}
                  radius={120}
                  src={profilePicturePreview}
                  alt="Profile Picture"
                  style={{ border: '2px solid white' }}
                />
                <FileInput
                  id="file-input"
                  label="Profile Picture"
                  placeholder="Upload your profile picture"
                  onChange={handleProfilePictureChange}
                  accept="image/*"
                  className={classes.text}
                  style={{ display: 'none' }}
                />
              </div>
            </Tooltip>
          </Center>
          <TextInput
            label="Name"
            className={classes.text}
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
            style={{ color: 'white' }}
          />
          <TextInput
            label="Your email"
            className={classes.text}
            placeholder="Enter your email"
            value={email}
            onChange={(e) => handleEmailChange(e.currentTarget.value)}
            required
            style={{ color: 'white' }}
            error={emailError || (emailExists ? 'This email is already exist.' : undefined)}
          />
          <PasswordInput
            label="Password"
            className={classes.text}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => handlePasswordChange(e.currentTarget.value)}
            error={passwordError}
            style={{ color: 'white' }}
          />
          <PasswordInput
            label="Confirm Password"
            className={classes.text}
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            style={{ color: 'white' }}
          />
          <TextInput
            label="Organization"
            className={classes.text}
            placeholder="Enter your organization"
            value={organization}
            onChange={(e) => setOrganization(e.currentTarget.value)}
            required
            style={{ color: 'white' }}
          />

          <Group justify="space-between" className={classes.controls}>
            <Anchor c="dimmed" size="sm" className={classes.control}>
              <Center inline>
                <IconArrowLeft style={{ width: rem(12), color: 'white', height: rem(12) }} stroke={1.5} />
                <Box onClick={handleLogin} ml={5} style={{ color: 'white' }}>
                  Back to the login page
                </Box>
              </Center>
            </Anchor>
            <Button onClick={handleProceed} color="green" fullWidth mt="xl" className={classes.control}>
              Proceed
            </Button>
          </Group>
        </div>
      </Container>
      <Modal
        opened={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        title="Crop your profile picture"
        size="lg"
        centered
      >
        <div style={{ position: 'relative', height: '400px' }}>
          <Cropper
            image={profilePicturePreview || undefined}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            style={{ containerStyle: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } }}
          />
        </div>
        <Button onClick={handleCropImage} color="green" fullWidth mt="xl">
          Crop Image
        </Button>
      </Modal>
    </div>
  );
};

export default RegisterPage;
