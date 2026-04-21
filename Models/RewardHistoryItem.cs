using System;
using System.ComponentModel.DataAnnotations;

namespace MyMvcProject.Models
{
    public class RewardHistoryItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [System.Text.Json.Serialization.JsonPropertyName("rewardName")]
        public string RewardName { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("receivedAt")]
        public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [System.Text.Json.Serialization.JsonPropertyName("source")]
        public string Source { get; set; } = string.Empty;
    }
}
