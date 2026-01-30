/*
  # السماح للمستخدمين المسجلين بإنشاء حجوزات دائمة
  
  1. المشكلة
    - السياسات الحالية تسمح فقط بإنشاء حجوزات مؤقتة (temporary) بدون user_id
    - المستخدمون المسجلون لا يستطيعون إنشاء حجوزات دائمة (pending/confirmed) لأنفسهم
    - خطأ: "new row violates row-level security policy for table reservations"
  
  2. التدفق الجديد
    - المستخدم يسجل حسابه أولاً (authenticated)
    - ثم يختار طريقة الدفع
    - عند تأكيد الدفع، يُنشأ حجز دائم مباشرة مرتبط بـ user_id
  
  3. الحل
    - إضافة سياسة جديدة تسمح للمستخدمين المصادق عليهم بإنشاء حجوزات لأنفسهم
    - يجب أن يكون user_id = auth.uid()
    - الحالة يمكن أن تكون pending, confirmed, waiting_for_payment, إلخ
  
  4. الأمان
    - المستخدم يستطيع فقط إنشاء حجوزات لنفسه (user_id = auth.uid())
    - لا يستطيع إنشاء حجوزات لمستخدمين آخرين
*/

-- إضافة سياسة للسماح للمستخدمين المصادق عليهم بإنشاء حجوزات دائمة لأنفسهم
CREATE POLICY "Authenticated users can create their own reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND user_id IS NOT NULL
  );

-- إضافة تعليق توضيحي
COMMENT ON POLICY "Authenticated users can create their own reservations" ON reservations IS 
'يسمح للمستخدمين المصادق عليهم بإنشاء حجوزات دائمة لأنفسهم فقط (user_id = auth.uid())';