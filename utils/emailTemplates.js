const VERIFICATION_EMAIL_TEMPLATE = (verificationCode) => {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>تأكيد البريد الإلكتروني - حرب الأوتاكو</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    /* Force light mode */
    :root {
      color-scheme: light;
    }
    
    /* Prevent dark mode inversion */
    html {
      color-scheme: light !important;
    }
    
    body { 
      font-family: 'Cairo', Arial, sans-serif;
      color-scheme: light !important;
      background-color: #ffffff !important;
    }
    
    /* Override dark mode for specific elements */
    [data-ogsc] {
      background-color: inherit !important;
      color: inherit !important;
    }
    
    /* Force background colors */
    .force-light-bg {
      background-color: #1E293B !important;
    }
    
    .force-light-text {
      color: #E3EAFF !important;
    }
    
    .force-yellow-bg {
      background: linear-gradient(135deg, #FFD607 0%, #FFA500 100%) !important;
    }
  </style>
</head>
        <body style="font-family: 'Cairo', Arial, sans-serif; line-height: 1.6; color: #E3EAFF; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); margin: 0; padding: 20px; color-scheme: light !important;">
  <div style="max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);" class="force-light-bg">
    
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #FFD607 0%, #FFA500 100%); padding: 30px 20px; text-align: center; position: relative;" class="force-yellow-bg">
      <!-- Logo Section -->
     
      <div style="background: #1E293B; display: inline-block; padding: 15px 25px; border-radius: 8px; margin-bottom: 15px;" class="force-light-bg">
        <img src="https://otaku-war-game.vercel.app/assets/logo-D8Rk2-Gc.png" alt="حرب الأوتاكو" style="width: 160px; height: 80px; object-fit: contain; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));" />
      </div>
      <h2 style="color: #1E293B; margin: 0; font-size: 24px; font-weight: 600;">
        تأكيد البريد الإلكتروني
      </h2>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px; background: #1E293B;" class="force-light-bg">
      <div style="text-align: center; margin-bottom: 30px;">
        <p style="color: #E3EAFF; font-size: 18px; margin-bottom: 20px;" class="force-light-text">
          مرحباً بك في عالم حرب الأوتاكو! 🎮
        </p>
        <p style="color: #E3EAFF; font-size: 16px; margin-bottom: 25px;" class="force-light-text">
          رمز التحقق الخاص بك هو:
        </p>
        
        <!-- Verification Code Box -->
        <div style="
          background: linear-gradient(135deg, #FFD607 0%, #FFA500 100%);
          padding: 20px;
          border-radius: 12px;
          margin: 25px 0;
          position: relative;
          transform: perspective(1000px) rotateX(5deg);
          box-shadow: 0 8px 25px rgba(255, 214, 7, 0.3);
        " class="force-yellow-bg">
          <span style="
            font-size: 36px; 
            font-weight: 700; 
            letter-spacing: 8px; 
            color: #1E293B;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            display: inline-block;
            padding: 10px 20px;
            background: rgba(255,255,255,0.9);
            border-radius: 8px;
            clip-path: polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%);
          ">${verificationCode}</span>
        </div>
        
        <p style="color: #E3EAFF; font-size: 16px; margin-bottom: 20px;" class="force-light-text">
          أدخل هذا الرمز في صفحة التحقق لإكمال تسجيلك
        </p>
        <p style="color: #94A3B8; font-size: 14px; margin-bottom: 25px;">
          ⏰ هذا الرمز سينتهي خلال 15 دقيقة لأسباب أمنية
        </p>
      </div>
     

      <!-- Footer -->
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #E3EAFF; font-size: 16px; margin-bottom: 15px;" class="force-light-text">
          إذا لم تقم بإنشاء حساب معنا، يرجى تجاهل هذا البريد الإلكتروني
        </p>
        <p style="color: #94A3B8; font-size: 14px; margin-bottom: 20px;">
          مع تحيات فريق حرب الأوتاكو 🎮
        </p>
        
        <!-- Social/Contact Info -->
        <div style="
          background: #0F172A;
          padding: 20px;
          border-radius: 8px;
          margin-top: 25px;
        ">
          <p style="color: #94A3B8; font-size: 12px; margin: 0;">
            هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

const WELCOME_EMAIL_TEMPLATE = (fullName) => {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>مرحباً بك في حرب الأوتاكو!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    /* Force light mode */
    :root {
      color-scheme: light;
    }
    
    html {
      color-scheme: light !important;
    }
    
    body { 
      font-family: 'Cairo', Arial, sans-serif;
      color-scheme: light !important;
      background-color: #ffffff !important;
    }
    
    [data-ogsc] {
      background-color: inherit !important;
      color: inherit !important;
    }
    
    .force-light-bg {
      background-color: #1E293B !important;
    }
    
    .force-light-text {
      color: #E3EAFF !important;
    }
    
    .force-yellow-bg {
      background: linear-gradient(135deg, #FFD607 0%, #FFA500 100%) !important;
    }
    
    .force-blue-bg {
      background: linear-gradient(135deg, #26A8FF 0%, #1E40AF 100%) !important;
    }
    
    .force-green-bg {
      background: linear-gradient(135deg, #4DFF39 0%, #22C55E 100%) !important;
    }
    
    .force-red-bg {
      background: linear-gradient(135deg, #FF6B6B 0%, #DC2626 100%) !important;
    }
  </style>
</head>
<body style="font-family: 'Cairo', Arial, sans-serif; line-height: 1.6; color: #E3EAFF; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); margin: 0; padding: 20px; color-scheme: light !important;">
  <div style="max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);" class="force-light-bg">
    
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #FFD607 0%, #FFA500 100%); padding: 30px 20px; text-align: center; position: relative;" class="force-yellow-bg">
      <!-- Logo Section -->
      <div style="background: #1E293B; display: inline-block; padding: 15px 25px; border-radius: 8px; margin-bottom: 15px;" class="force-light-bg">
        <img src="https://otaku-war-game.vercel.app/assets/logo-D8Rk2-Gc.png" alt="حرب الأوتاكو" style="width: 160px; height: 80px; object-fit: contain; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));" />
      </div>
      <h2 style="color: #1E293B; margin: 0; font-size: 24px; font-weight: 600;">
        مرحباً بك في حرب الأوتاكو!
      </h2>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px; background: #1E293B;" class="force-light-bg">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
        <h1 style="color: #FFD607; font-size: 28px; font-weight: 700; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
          تم التحقق من بريدك الإلكتروني بنجاح!
        </h1>
        <p style="color: #E3EAFF; font-size: 18px; margin-bottom: 20px;" class="force-light-text">
          مرحباً ${fullName || "المحارب"}! 🗡️
        </p>
        <p style="color: #E3EAFF; font-size: 16px; margin-bottom: 25px;" class="force-light-text">
          أنت الآن جاهز للانضمام إلى معركة حرب الأوتاكو! استعد لتحدي معرفتك ومواجهة الفرق الأخرى
        </p>
      </div>


      <!-- Call to Action -->
      <div style="
        background: linear-gradient(135deg, #FFD607 0%, #FFA500 100%);
        padding: 25px;
        border-radius: 12px;
        margin: 30px 0;
        text-align: center;
        transform: perspective(1000px) rotateX(5deg);
        box-shadow: 0 8px 25px rgba(255, 214, 7, 0.3);
      " class="force-yellow-bg">
        <h3 style="color: #1E293B; margin: 0 0 15px 0; font-size: 22px; font-weight: 700;">
          🚀 ابدأ اللعب الآن!
        </h3>
        <p style="color: #1E293B; font-size: 16px; margin: 0; font-weight: 600;">
          انقر على الرابط أدناه لإنشاء لعبة جديدة أو الانضمام إلى لعبة موجودة
        </p>
        <div style="margin-top: 20px;">
          <a href="https://otaku-war-game.vercel.app" style="
            display: inline-block;
            background: #1E293B;
            color: #FFD607;
            padding: 12px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
          ">🎮 ابدأ اللعب</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #E3EAFF; font-size: 16px; margin-bottom: 15px;" class="force-light-text">
          نتمنى لك وقتاً ممتعاً ومليئاً بالتحديات! 🎯
        </p>
        <p style="color: #94A3B8; font-size: 14px; margin-bottom: 20px;">
          مع تحيات فريق حرب الأوتاكو 🎮
        </p>
        
        <!-- Social/Contact Info -->
        <div style="
          background: #0F172A;
          padding: 20px;
          border-radius: 8px;
          margin-top: 25px;
        ">
          <p style="color: #94A3B8; font-size: 12px; margin: 0;">
            هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

const RESET_PASSWORD_EMAIL_TEMPLATE = (resetCode, fullName) => {
  return `
<<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>إعادة تعيين كلمة المرور - حرب الأوتاكو</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    /* Force light mode */
    :root {
      color-scheme: light;
    }
    
    html {
      color-scheme: light !important;
    }
    
    body { 
      font-family: 'Cairo', Arial, sans-serif;
      color-scheme: light !important;
      background-color: #ffffff !important;
    }
    
    [data-ogsc] {
      background-color: inherit !important;
      color: inherit !important;
    }
    
    .force-light-bg {
      background-color: #1E293B !important;
    }
    
    .force-light-text {
      color: #E3EAFF !important;
    }
    
    .force-yellow-bg {
      background: linear-gradient(135deg, #FFD607 0%, #FFA500 100%) !important;
    }
    
    .force-red-bg {
      background: linear-gradient(135deg, #FF6B6B 0%, #DC2626 100%) !important;
    }
    
    .force-blue-bg {
      background: linear-gradient(135deg, #26A8FF 0%, #1E40AF 100%) !important;
    }
  </style>
</head>
<body style="font-family: 'Cairo', Arial, sans-serif; line-height: 1.6; color: #E3EAFF; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); margin: 0; padding: 20px; color-scheme: light !important;">
  <div style="max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);" class="force-light-bg">
    
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #FF6B6B 0%, #DC2626 100%); padding: 30px 20px; text-align: center; position: relative;" class="force-red-bg">
      <!-- Logo Section -->
      <div style="background: #1E293B; display: inline-block; padding: 15px 25px; border-radius: 8px; margin-bottom: 15px;" class="force-light-bg">
        <img src="https://otaku-war-game.vercel.app/assets/logo-D8Rk2-Gc.png" alt="حرب الأوتاكو" style="width: 160px; height: 80px; object-fit: contain; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));" />
      </div>
      <h2 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
        🔐 إعادة تعيين كلمة المرور
      </h2>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px; background: #1E293B;" class="force-light-bg">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
        <h1 style="color: #FF6B6B; font-size: 28px; font-weight: 700; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
          طلب إعادة تعيين كلمة المرور
        </h1>
        <p style="color: #E3EAFF; font-size: 18px; margin-bottom: 20px;" class="force-light-text">
          مرحباً ${fullName || "المحارب"}! 🗡️
        </p>
        <p style="color: #E3EAFF; font-size: 16px; margin-bottom: 25px;" class="force-light-text">
          لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. رمز إعادة التعيين الخاص بك هو:
        </p>
        
        <!-- Reset Code Box -->
        <div style="
          background: linear-gradient(135deg, #FF6B6B 0%, #DC2626 100%);
          padding: 20px;
          border-radius: 12px;
          margin: 25px 0;
          position: relative;
          transform: perspective(1000px) rotateX(5deg);
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
        " class="force-red-bg">
          <span style="
            font-size: 36px; 
            font-weight: 700; 
            letter-spacing: 8px; 
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            display: inline-block;
            padding: 10px 20px;
            background: rgba(255,255,255,0.9);
            border-radius: 8px;
            clip-path: polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%);
            color: #DC2626;
          ">${resetCode}</span>
        </div>
        
        <p style="color: #E3EAFF; font-size: 16px; margin-bottom: 20px;" class="force-light-text">
          أدخل هذا الرمز في صفحة إعادة تعيين كلمة المرور
        </p>
        <p style="color: #94A3B8; font-size: 14px; margin-bottom: 25px;">
          ⏰ هذا الرمز سينتهي خلال 15 دقيقة لأسباب أمنية
        </p>
      </div>

      <!-- Security Warning -->
      <div style="
        background: linear-gradient(135deg, #26A8FF 0%, #1E40AF 100%);
        padding: 25px;
        border-radius: 12px;
        margin: 30px 0;
        text-align: center;
      " class="force-blue-bg">
        <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">
          نصائح أمنية مهمة
        </h3>
        <div style="text-align: right; color: rgba(255,255,255,0.9); font-size: 14px;">
          <p style="margin: 8px 0;"> لا تشارك هذا الرمز مع أي شخص •</p>
          <p style="margin: 8px 0;">استخدم كلمة مرور قوية وفريدة • </p>
          <p style="margin: 8px 0;">لا تستخدم نفس كلمة المرور في مواقع أخرى • </p>
          <p style="margin: 8px 0;">قم بتفعيل المصادقة الثنائية إذا أمكن • </p>
        </div>
      </div>

      
      <!-- Call to Action -->
      <div style="
        background: linear-gradient(135deg, #FFD607 0%, #FFA500 100%);
        padding: 25px;
        border-radius: 12px;
        margin: 30px 0;
        text-align: center;
        transform: perspective(1000px) rotateX(5deg);
        box-shadow: 0 8px 25px rgba(255, 214, 7, 0.3);
      " class="force-yellow-bg">
        <h3 style="color: #1E293B; margin: 0 0 15px 0; font-size: 22px; font-weight: 700;">
           !أعد تعيين كلمة المرور الآن 🔐 
        </h3>
        <p style="color: #1E293B; font-size: 16px; margin: 0; font-weight: 600;">
          انقر على الرابط أدناه للانتقال إلى صفحة إعادة تعيين كلمة المرور
        </p>
        <div style="margin-top: 20px;">
          <a href="https://otaku-war-game.vercel.app/reset-password" style="
            display: inline-block;
            background: #1E293B;
            color: #FFD607;
            padding: 12px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
          ">إعادة تعيين كلمة المرور 🔐 </a>
        </div>
      </div>

      <!-- Important Notice -->
      <div style="
        background: #0F172A;
        padding: 20px;
        border-radius: 8px;
        margin: 25px 0;
        border-left: 4px solid #FF6B6B;
      ">
        <h4 style="color: #FF6B6B; margin: 0 0 10px 0; font-size: 16px; text-align:right; font-weight: 600;">
           ملاحظة مهمة ⚠️ 
        </h4>
        <p style="color: #94A3B8; font-size: 14px; margin: 0; text-align:right;">
          إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني وتأكد من أن حسابك آمن. 
          إذا كنت قلقاً بشأن أمان حسابك، يرجى التواصل مع فريق الدعم الفني.
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #E3EAFF; font-size: 16px; margin-bottom: 15px;" class="force-light-text">
           ! نتمنى لك تجربة آمنة وممتعة 🛡️
        </p>
        <p style="color: #94A3B8; font-size: 14px; margin-bottom: 20px;">
          مع تحيات فريق حرب الأوتاكو 🎮
        </p>
        
        <!-- Social/Contact Info -->
        <div style="
          background: #0F172A;
          padding: 20px;
          border-radius: 8px;
          margin-top: 25px;
        ">
          <p style="color: #94A3B8; font-size: 12px; margin: 0;">
            هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

module.exports = {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  RESET_PASSWORD_EMAIL_TEMPLATE,
};
