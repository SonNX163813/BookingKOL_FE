import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  IconButton,
  Avatar,
  Rating,
  Chip,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import {
  Star,
  Clock,
  Users,
  Shield,
  Headphones,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Music,
  Tv,
  Gamepad2,
  UserCheck
} from 'lucide-react';

const Homepage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Sample data
  const categories = [
    {
      title: 'Ca sĩ',
      icon: <Music size={40} />,
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
      count: '150+ KOLs'
    },
    {
      title: 'Diễn viên',
      icon: <Tv size={40} />,
      image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=200&fit=crop',
      count: '80+ KOLs'
    },
    {
      title: 'Streamer',
      icon: <Gamepad2 size={40} />,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop',
      count: '200+ KOLs'
    },
    {
      title: 'Influencer',
      icon: <UserCheck size={40} />,
      image: 'https://images.unsplash.com/photo-1494790108755-2616c2c6b2e0?w=300&h=200&fit=crop',
      count: '300+ KOLs'
    }
  ];

  const features = [
    {
      icon: <Clock size={48} />,
      title: 'Dễ dàng đặt lịch',
      description: 'Đặt lịch hợp tác với KOL chỉ trong vài cú click'
    },
    {
      icon: <Users size={48} />,
      title: 'Đa dạng KOL',
      description: 'Hàng nghìn KOL từ nhiều lĩnh vực khác nhau'
    },
    {
      icon: <Shield size={48} />,
      title: 'Thanh toán an toàn',
      description: 'Hệ thống thanh toán được bảo mật tuyệt đối'
    },
    {
      icon: <Headphones size={48} />,
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ hỗ trợ khách hàng luôn sẵn sàng'
    }
  ];

  const testimonials = [
    {
      name: 'Nguyễn Minh Anh',
      company: 'CEO - Beauty Brand',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616c2c6b2e0?w=100&h=100&fit=crop',
      rating: 5,
      comment: 'Nền tảng tuyệt vời! Tôi đã tìm được nhiều KOL phù hợp cho chiến dịch marketing của mình.'
    },
    {
      name: 'Trần Quốc Bảo',
      company: 'Marketing Director - Tech Startup',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      rating: 5,
      comment: 'Quy trình booking nhanh chóng, KOL chất lượng cao. Rất hài lòng với dịch vụ.'
    },
    {
      name: 'Lê Thị Hương',
      company: 'Founder - Fashion Store',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      rating: 5,
      comment: 'Đội ngũ hỗ trợ nhiệt tình, giúp tôi tìm được những KOL phù hợp nhất với thương hiệu.'
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <Box sx={{ bgcolor: '#ffffff' }}>

      

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #CA54CA 0%, #E67BE6 100%)',
          color: 'white',
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold',
                  mb: 2,
                  fontSize: { xs: '2rem', md: '3rem' }
                }}
              >
                Thuê KOL dễ dàng –<br />Booking nhanh chóng
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4, 
                  opacity: 0.9,
                  fontWeight: 300,
                  lineHeight: 1.6
                }}
              >
                Kết nối với hàng nghìn KOL hàng đầu Việt Nam. 
                Tìm kiếm, đặt lịch và hợp tác một cách nhanh chóng, 
                chuyên nghiệp.
              </Typography>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowRight />}
                sx={{
                  bgcolor: 'white',
                  color: '#CA54CA',
                  fontWeight: 'bold',
                  borderRadius: '30px',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: '#f8f8f8',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Bắt đầu ngay
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: { xs: '300px', md: '400px' }
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=500&h=400&fit=crop"
                  alt="KOL Illustration"
                  style={{
                    width: '100%',
                    maxWidth: '450px',
                    height: 'auto',
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography 
          variant="h3" 
          component="h2" 
          align="center" 
          sx={{ 
            mb: 6, 
            fontWeight: 'bold',
            color: '#333',
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Danh mục nổi bật
        </Typography>
        <Grid container spacing={4}>
          {categories.map((category, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 25px rgba(202, 84, 202, 0.2)'
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={category.image}
                  alt={category.title}
                />
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Box sx={{ color: '#CA54CA', mb: 2 }}>
                    {category.icon}
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {category.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {category.count}
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: '#CA54CA',
                      color: '#CA54CA',
                      borderRadius: '20px',
                      '&:hover': {
                        bgcolor: '#CA54CA',
                        color: 'white'
                      }
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: '#f8f9fa', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            align="center" 
            sx={{ 
              mb: 6, 
              fontWeight: 'bold',
              color: '#333',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Ưu điểm dịch vụ
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    height: '100%',
                    borderRadius: '15px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ color: '#CA54CA', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography 
          variant="h3" 
          component="h2" 
          align="center" 
          sx={{ 
            mb: 6, 
            fontWeight: 'bold',
            color: '#333',
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Khách hàng nói gì
        </Typography>
        <Box sx={{ position: 'relative', maxWidth: 600, mx: 'auto' }}>
          <Card
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
            }}
          >
            <Avatar
              src={testimonials[currentTestimonial].avatar}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
            />
            <Rating 
              value={testimonials[currentTestimonial].rating} 
              readOnly 
              sx={{ mb: 2, color: '#CA54CA' }} 
            />
            <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic', lineHeight: 1.6 }}>
              "{testimonials[currentTestimonial].comment}"
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {testimonials[currentTestimonial].name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {testimonials[currentTestimonial].company}
            </Typography>
          </Card>
          
          <IconButton
            onClick={prevTestimonial}
            sx={{
              position: 'absolute',
              left: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
          >
            <ChevronLeft />
          </IconButton>
          
          <IconButton
            onClick={nextTestimonial}
            sx={{
              position: 'absolute',
              right: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Container>

      {/* Final CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #CA54CA 0%, #B148B1 100%)',
          color: 'white',
          py: { xs: 6, md: 8 },
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              mb: 3, 
              fontWeight: 'bold',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Sẵn sàng hợp tác cùng KOL?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontWeight: 300 }}>
            Bắt đầu xây dựng chiến dịch marketing thành công với đội ngũ KOL chất lượng cao
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowRight />}
            sx={{
              bgcolor: 'white',
              color: '#CA54CA',
              fontWeight: 'bold',
              borderRadius: '30px',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: '#f8f8f8',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Đặt lịch ngay
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#2c2c2c', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#CA54CA' }}>
                KOL Booking
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, lineHeight: 1.6 }}>
                Nền tảng kết nối thương hiệu với KOL hàng đầu Việt Nam. 
                Tạo ra những chiến dịch marketing hiệu quả và ấn tượng.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Liên hệ
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Email: contact@kolbooking.vn<br />
                Hotline: 0900 123 456<br />
                Địa chỉ: 123 Nguyễn Huệ, Q1, TP.HCM
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 4, pt: 4, borderTop: '1px solid #444' }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              © 2024 KOL Booking. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Homepage;