import { PartialType } from '@nestjs/swagger';
import { CreateProfileDto } from './create-profile.dto';

/**
 * DTO for partial profile updates.
 * All fields are optional - only provided fields will be updated.
 */
export class UpdateProfileDto extends PartialType(CreateProfileDto) {}
