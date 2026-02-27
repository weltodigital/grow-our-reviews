-- Row Level Security Policies

-- Profiles policies (users can only access their own profile)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Customers policies (users can only access their own customers)
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" ON customers
  FOR DELETE USING (auth.uid() = user_id);

-- Review requests policies (users can only access their own review requests)
CREATE POLICY "Users can view own review requests" ON review_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review requests" ON review_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review requests" ON review_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own review requests" ON review_requests
  FOR DELETE USING (auth.uid() = user_id);

-- Public access to review requests by token (for sentiment gate)
CREATE POLICY "Public can view review requests by token" ON review_requests
  FOR SELECT USING (token IS NOT NULL);

CREATE POLICY "Public can update review requests by token" ON review_requests
  FOR UPDATE USING (token IS NOT NULL);

-- Feedback policies (users can only access their own feedback)
CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON feedback
  FOR DELETE USING (auth.uid() = user_id);

-- Public access to insert feedback (for sentiment gate)
CREATE POLICY "Public can insert feedback via token" ON feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM review_requests
      WHERE review_requests.id = feedback.review_request_id
      AND review_requests.token IS NOT NULL
    )
  );