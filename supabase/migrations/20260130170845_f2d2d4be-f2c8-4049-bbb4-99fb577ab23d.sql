-- Add UPDATE policy for chat_messages
CREATE POLICY "Users can update own messages"
  ON public.chat_messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for chat_messages
CREATE POLICY "Users can delete own messages"
  ON public.chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);